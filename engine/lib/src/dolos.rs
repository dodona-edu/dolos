use crate::config::DolosConfig;
use crate::file::{AnalysisData, File, FileSet};
use crate::fragment::resolve_fragments;
use crate::ignore;
use crate::metadata::Metadata;
use crate::reader::Dataset;
use crate::report::Report;
use crate::winnowing::fingerprints::{Fingerprint, Winnow};
use crate::winnowing::region::Region;
use crate::winnowing::tokenizer::{Tokenizer, Tokens};
use std::fmt;
use std::io::{Error, Result};
use std::ops::Range;
use std::path::{Path, PathBuf};
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
    /// used.
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
    /// - Several paths: [`NotFound`] when one of them is not a regular file.
    /// - One path that is not a directory, has no `csv` extension and has no
    ///   archive extension: [`InvalidInput`]. This includes a path that does
    ///   not exist.
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
    /// - [`InvalidInput`] when fewer than 2 files of the language remain.
    ///
    /// Reading the files:
    ///
    /// - The I/O error of a failed input file read, for example [`NotFound`]
    ///   for a file in the `filename` column of a CSV file that does not
    ///   exist. A file that is not valid UTF-8 gives [`InvalidData`].
    /// - The I/O error of a failed read of the
    ///   [`ignore`](crate::DolosConfigBuilder::ignore) file, for example
    ///   [`NotFound`].
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
        let dataset = Dataset::create(files, config.language)?;
        let metadata = Metadata::from_config(&config, &dataset);

        let tokenizer = Tokenizer::new(metadata.language);

        let locations = if metadata.include_fragments || metadata.include_analysis_data {
            Some(Vec::new())
        } else {
            None
        };

        let mut dolos = Dolos {
            metadata,
            files: Vec::new(),
            fingerprints: Vec::new(),
            template_fingerprints: Vec::new(),
            locations,
            tokenizer,
        };

        dolos.add_files(dataset.file_set)?;

        if let Some(ignore_path) = dolos.metadata.ignore.clone() {
            dolos.add_ignore_file(ignore_path)?;
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
        self.tokenizer
            .parse(content)
            .tokens(self.metadata.include_comments)
            .winnow(
                self.metadata.kgram_length,
                self.metadata.kgrams_in_window,
                keep_locations,
            )
    }

    /// Tokenize a source file and register it as a regular file in the analysis.
    ///
    /// The path and content are added to `self.files`, the fingerprints to
    /// `self.fingerprints`, and the locations to `self.locations` when they are kept.
    fn add_file(&mut self, base_dir: &Path, relative: &Path) -> Result<()> {
        let content = std::fs::read_to_string(base_dir.join(relative))?;
        let (fingerprints, locations) = self.fingerprint(&content, self.locations.is_some());

        self.fingerprints.push(fingerprints);
        if let Some(locs) = self.locations.as_mut() {
            locs.push(locations.expect("locations should be present when they are kept"));
        }
        self.files.push(File {
            id: self.files.len(),
            relative_path: relative.to_path_buf(),
            content,
            analysis_data: None,
        });
        Ok(())
    }

    /// Tokenize a template/ignore file and append its fingerprints to
    /// `self.template_fingerprints` so that the suffix tree can suppress common matches.
    ///
    /// Ignore files are never added to `self.files` or `self.locations`: they
    /// do not appear in the report, and no fragment resolution is needed for them.
    fn add_ignore_file(&mut self, path: PathBuf) -> Result<()> {
        let content = std::fs::read_to_string(&path).map_err(|e| {
            Error::new(
                e.kind(),
                format!("Could not read ignore file '{}': {}", path.display(), e),
            )
        })?;
        let (fingerprints, _) = self.fingerprint(&content, false);
        self.template_fingerprints.push(fingerprints);
        Ok(())
    }

    fn add_files(&mut self, file_set: FileSet) -> Result<()> {
        for relative in &file_set.relative_paths {
            self.add_file(&file_set.base_dir, relative)?;
        }
        Ok(())
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
                    resolve_fragments(matches, locations, &self.metadata.fragment_sort_by)
                });

        if self.metadata.include_analysis_data {
            self.attach_analysis_data(ignored);
        }

        let files = self.files.into_iter().map(Rc::new).collect();
        Report::new(result.metrics(), fragments, files, self.metadata)
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
