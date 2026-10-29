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

pub struct Dolos {
    metadata: Metadata,
    files: Vec<File>,
    fingerprints: Vec<Vec<Fingerprint>>,
    template_fingerprints: Vec<Vec<Fingerprint>>,
    locations: Option<Vec<Vec<Region>>>,
    tokenizer: Tokenizer,
}

impl Dolos {
    /// Create a new `Dolos` analysis from a list of input paths and index arguments.
    ///
    /// Accepted inputs for `files`:
    /// - **Multiple paths** → treated as individual files.
    /// - **One directory** → files collected recursively.
    /// - **One CSV file** → file list read from the `filename` column.
    /// - **One archive** → extracted and treated as a directory.
    ///
    /// Only the files of the configured language are analyzed. Without a configured
    /// language, the language that most file extensions belong to is used.
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

    /// Run the analysis and build a [`Report`].
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
