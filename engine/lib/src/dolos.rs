use crate::config::DolosConfig;
use crate::file::{AnalysisData, File};
use crate::fragment::resolve_fragments;
use crate::ignore;
use crate::metadata::Metadata;
use crate::reader::{Source, Template};
use crate::report::Report;
use crate::winnowing::fingerprints::{Fingerprint, winnow};
use crate::winnowing::region::Region;
use crate::winnowing::tokenizer::Tokenizer;
use std::fmt;
use std::io::Result;
use std::ops::Range;
use std::path::PathBuf;
use std::rc::Rc;

/// A plagiarism analysis over a set of source files.
pub struct Dolos {
    metadata: Metadata,
    files: Vec<File>,
    fingerprints: Vec<Vec<Fingerprint>>,
    template_fingerprints: Vec<Vec<Fingerprint>>,
    locations: Option<Vec<Vec<Region>>>,
    tokenizer: Tokenizer,
}

impl Dolos {
    /// Create an analysis: read, tokenize and fingerprint the input files.
    ///
    /// Only the files of the configured language are analyzed. Without a
    /// configured language, the language that most file extensions belong to is
    /// used. Plain text ([`Language::Char`]) is used only when no file belongs
    /// to another language. The files of another language, and the files that
    /// cannot be read, are skipped with a warning through the [`tracing`]
    /// crate. This holds for the input and the template.
    ///
    /// # Parameters
    ///
    /// - `files`: the input paths, in one of these forms:
    ///   - **Several paths**: each path is a file to analyze.
    ///   - **One directory**: all files under it, recursively. When the
    ///     directory holds an `info.csv`, the files listed in its `filename`
    ///     column instead.
    ///   - **One CSV file**: the files listed in its `filename` column,
    ///     relative to the directory of the CSV file.
    ///   - **One archive** (`.zip`, `.tar`, `.tar.gz`, `.tgz`, `.tar.bz2`,
    ///     `.tbz`, `.tbz2`): extracted, then read as a directory.
    /// - `config`: the analysis configuration. See [`DolosConfig::builder`].
    ///
    /// # Errors
    ///
    /// Reading the input:
    ///
    /// - `files` is empty: [`InvalidInput`].
    /// - Several paths, or one path that is not a directory, has no `csv`
    ///   extension and has no archive extension: [`NotFound`] when one of them
    ///   is not a regular file.
    /// - One CSV file, or one directory with an `info.csv`: [`InvalidData`]
    ///   when the CSV file cannot be opened or parsed, or has no `filename`
    ///   column. A CSV path that does not exist also gives [`InvalidData`].
    /// - One directory: the I/O error of a failed directory read, for example
    ///   [`PermissionDenied`].
    /// - One archive: the I/O error when the archive cannot be opened, for
    ///   example [`NotFound`]. For a zip archive, [`InvalidData`] when the file
    ///   is not a zip archive and [`Other`] when an entry cannot be extracted.
    ///   For a tar archive, the I/O error of the tar, gzip or bzip2 reader.
    ///
    /// Selecting the files:
    ///
    /// - [`InvalidInput`] when no language is configured and none can be
    ///   detected: no file has a known extension, or several languages share
    ///   the highest file count.
    /// - [`InvalidInput`] when fewer than 2 readable files of the language
    ///   remain. This includes one regular file as input.
    ///
    /// Reading the [`template`](crate::DolosConfigBuilder::template):
    ///
    /// - The errors of reading the input. An empty list gives no error. Neither
    ///   does a template without readable files of the language: the analysis
    ///   then has no template.
    ///
    /// [`InvalidData`]: std::io::ErrorKind::InvalidData
    /// [`InvalidInput`]: std::io::ErrorKind::InvalidInput
    /// [`NotFound`]: std::io::ErrorKind::NotFound
    /// [`Other`]: std::io::ErrorKind::Other
    /// [`PermissionDenied`]: std::io::ErrorKind::PermissionDenied
    ///
    /// # Examples
    ///
    /// ```
    /// # #[cfg(feature = "lang-javascript")]
    /// # fn main() -> std::io::Result<()> {
    /// use dolos::{Dolos, DolosConfig};
    /// use std::path::Path;
    ///
    /// let fixtures = Path::new(env!("CARGO_MANIFEST_DIR")).join("fixtures");
    /// let files = vec![fixtures.join("sample1.js"), fixtures.join("sample2.js")];
    ///
    /// let dolos = Dolos::new(files, DolosConfig::default())?;
    /// # Ok(())
    /// # }
    /// # #[cfg(not(feature = "lang-javascript"))]
    /// # fn main() {}
    /// ```
    pub fn new(files: Vec<PathBuf>, config: DolosConfig) -> Result<Self> {
        let (source, metadata, template) = read_input(files, config)?;

        let tokenizer = Tokenizer::new(metadata.language, metadata.include_comments);

        let locations =
            (metadata.include_fragments || metadata.include_analysis_data).then(Vec::new);

        let mut dolos = Dolos {
            metadata,
            files: Vec::new(),
            fingerprints: Vec::new(),
            template_fingerprints: Vec::new(),
            locations,
            tokenizer,
        };

        let description = format!(
            "fingerprinting {} {} files",
            source.files.len(),
            source.language.name()
        );
        tracing::info_span!("fingerprint", %description).in_scope(|| {
            for file in source.files {
                dolos.add_file(file);
            }
        });

        if !template.files.is_empty() {
            let description = match template.files.len() {
                1 => "fingerprinting 1 template file".to_string(),
                count => format!("fingerprinting {count} template files"),
            };
            tracing::info_span!("template", %description)
                .in_scope(|| dolos.add_template(&template.files));
        }

        Ok(dolos)
    }

    /// Parse `content` into a fingerprint sequence (and optionally per-fingerprint
    /// source locations when `keep_locations` is `true`).
    fn fingerprint(
        &mut self,
        content: &str,
        keep_locations: bool,
    ) -> (Vec<Fingerprint>, Option<Vec<Region>>) {
        winnow(
            &self.tokenizer.tokenize(content),
            self.metadata.kgram_length,
            self.metadata.kgrams_in_window,
            keep_locations,
        )
    }

    /// Tokenize an input file and register it as a file of the analysis.
    ///
    /// The file is added to `self.files`, the fingerprints to `self.fingerprints`,
    /// and the locations to `self.locations` when they are kept.
    fn add_file(&mut self, file: File) {
        let (fingerprints, locations) = self.fingerprint(&file.content, self.locations.is_some());

        self.fingerprints.push(fingerprints);
        if let Some(locs) = self.locations.as_mut() {
            locs.push(locations.expect("locations should be present when they are kept"));
        }
        self.files.push(file);
    }

    /// Tokenize the template files and append their fingerprints to
    /// `self.template_fingerprints`.
    ///
    /// Template files are never added to `self.files` or `self.locations`: they
    /// do not appear in the report, and no fragment resolution is needed for them.
    fn add_template(&mut self, files: &[File]) {
        for file in files {
            let (fingerprints, _) = self.fingerprint(&file.content, false);
            self.template_fingerprints.push(fingerprints);
        }
    }

    /// Fill in the analysis data of every file.
    ///
    /// Takes the fingerprints and the locations out of the analysis, so it must
    /// run after the fragments are resolved.
    fn attach_analysis_data(&mut self, ignored: Vec<Vec<Range<usize>>>) {
        let fingerprints = std::mem::take(&mut self.fingerprints);
        let regions = self
            .locations
            .take()
            .expect("locations are kept when the analysis data is exported");

        for (((file, fingerprints), regions), ignored) in self
            .files
            .iter_mut()
            .zip(fingerprints)
            .zip(regions)
            .zip(ignored)
        {
            file.analysis_data = Some(AnalysisData { fingerprints, regions, ignored });
        }
    }

    /// Compare all files pairwise and build a [`Report`].
    ///
    /// The report holds one [`Pair`](crate::Pair) for every pair of files. The
    /// pairs carry fragments only when
    /// [`Metadata::include_fragments`](crate::Metadata::include_fragments) is
    /// `true`.
    ///
    /// # Examples
    ///
    /// ```
    /// # #[cfg(feature = "lang-javascript")]
    /// # fn main() -> std::io::Result<()> {
    /// use dolos::{Dolos, DolosConfig};
    /// use std::path::Path;
    ///
    /// let fixtures = Path::new(env!("CARGO_MANIFEST_DIR")).join("fixtures");
    /// let files = vec![fixtures.join("sample1.js"), fixtures.join("sample2.js")];
    ///
    /// let report = Dolos::new(files, DolosConfig::default())?.build_report();
    /// assert_eq!(report.pairs.len(), 1);
    /// # Ok(())
    /// # }
    /// # #[cfg(not(feature = "lang-javascript"))]
    /// # fn main() {}
    /// ```
    pub fn build_report(mut self) -> Report {
        let file_count = self.files.len();
        let description = match file_count * (file_count - 1) / 2 {
            1 => "comparing 1 pair".to_string(),
            pairs => format!("comparing {pairs} pairs"),
        };
        let _step = tracing::info_span!("compare", %description).entered();
        let ignored = ignore::classify(
            &self.fingerprints,
            &self.template_fingerprints,
            self.metadata.max_fingerprint_file_count,
        );
        let result = dolos_core::analyze(
            &self.fingerprints,
            Some(&ignored),
            &self.metadata.analysis_options(),
        )
        .expect(
            "Dolos::new checks the file count, the fingerprints are hashed below the sentinel, \
             and classify indexes its own input",
        );

        let fragments =
            result
                .matches()
                .zip(self.locations.as_deref())
                .map(|(matches, locations)| {
                    resolve_fragments(matches, locations, self.metadata.fragment_sort_by)
                });

        if self.metadata.include_analysis_data {
            self.attach_analysis_data(ignored);
        }

        let files = self.files.into_iter().map(Rc::new).collect();
        Report::new(result.metrics(), fragments, files, self.metadata)
    }
}

/// Read the input files and the template in the read step, and return them with
/// the metadata of the analysis.
fn read_input(files: Vec<PathBuf>, config: DolosConfig) -> Result<(Source, Metadata, Template)> {
    let description = read_description(&files);
    let span = tracing::info_span!("read", %description, error = tracing::field::Empty);
    span.in_scope(|| {
        let source = Source::create(files, config.language)?;
        if config.max_fingerprint_percentage.is_some() && source.files.len() < 3 {
            tracing::warn!(
                "the maximum fingerprint percentage has no use with fewer than 3 files; \
                 it ignores every shared fingerprint or none"
            );
        }
        let metadata = Metadata::from_config(&config, &source);
        let template = Template::create(config.template, metadata.language)?;
        Ok((source, metadata, template))
    })
    .inspect_err(|e| {
        span.record("error", tracing::field::display(e));
    })
}

/// Describe the read step, such as `reading 'submissions.zip'` or `reading 3 files`.
fn read_description(files: &[PathBuf]) -> String {
    match files {
        [path] => format!("reading '{}'", path.display()),
        _ => format!("reading {} files", files.len()),
    }
}

impl fmt::Debug for Dolos {
    fn fmt(&self, fmt: &mut fmt::Formatter) -> fmt::Result {
        fmt.debug_struct("Dolos")
            .field("name", &self.metadata.report_name)
            .field("language", &self.metadata.language)
            .field("files", &self.files)
            .finish()
    }
}
