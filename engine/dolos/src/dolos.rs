use crate::config::DolosConfig;
use crate::config::{IndexConfig, ReportConfig};
use crate::file::{File, FileSet};
use crate::reader::Dataset;
use crate::report::Report;
use crate::suffixtree::tree::SuffixTree;
use crate::winnowing::fingerprints::{Fingerprint, Winnow};
use crate::winnowing::region::Region;
use crate::winnowing::tokenizer::{Tokenizer, Tokens};
use std::fmt;
use std::io::{Error, ErrorKind, Result};
use std::path::{Path, PathBuf};
use std::rc::Rc;

pub struct Dolos {
    report_config: ReportConfig,
    index_config: IndexConfig,
    files: Vec<Rc<File>>,
    hashes: Vec<Vec<Fingerprint>>,
    ignore_hashes: Vec<Vec<Fingerprint>>,
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
    pub fn new(files: Vec<PathBuf>, config: DolosConfig) -> Result<Self> {
        let dataset = Dataset::create(files)?;
        let report_config = ReportConfig::from_config(&config, dataset.name);
        let index_config = IndexConfig::from_config(&config, &dataset.file_set);

        let tokenizer = Tokenizer::new(index_config.language);
        let locations = index_config.keep_fragments.then_some(Vec::new());

        let mut dolos = Dolos {
            report_config,
            index_config,
            files: Vec::new(),
            hashes: Vec::new(),
            ignore_hashes: Vec::new(),
            locations,
            tokenizer,
        };

        dolos.add_files(dataset.file_set)?;

        // Ignore file is added after all regular files, so its word index is
        // always >= regular_word_count.
        if let Some(ignore_path) = dolos.index_config.ignore.clone() {
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
            .tokens(self.index_config.include_comments)
            .winnow(
                self.index_config.kgram_length,
                self.index_config.kgrams_in_window,
                keep_locations,
            )
    }

    /// Tokenize a source file and register it as a regular file in the analysis.
    ///
    /// The file is added to `self.files`, its fingerprints to `self.hashes`, and
    /// (when `keep_fragments` is set) its locations to `self.locations`.
    fn add_file(&mut self, base_dir: &Path, relative: &Path) -> Result<()> {
        // Only enforce the language-extension match when the language was
        // auto-detected.  If the user explicitly specified the language, they
        // know what they want (e.g., files exported without an extension).
        if !self.index_config.language_user_specified
            && !self.index_config.language.matches(relative)
        {
            return Err(Error::new(
                ErrorKind::InvalidInput,
                format!("Language does not match file: {}", relative.display()),
            ));
        }

        let content = std::fs::read_to_string(base_dir.join(relative))?;
        let (hashes, locations) = self.fingerprint(&content, self.index_config.keep_fragments);

        self.hashes.push(hashes);
        if let Some(locs) = self.locations.as_mut() {
            locs.push(locations.expect("locations should be present when keep_fragments is true"));
        }
        self.files.push(Rc::new(File {
            relative_path: relative.to_path_buf(),
            content: self.index_config.keep_fragments.then_some(content),
        }));
        Ok(())
    }

    /// Tokenize a template/ignore file and append its fingerprints to the hash
    /// list so that the suffix tree can suppress common matches.
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
        let (hashes, _) = self.fingerprint(&content, false);
        self.ignore_hashes.push(hashes);
        Ok(())
    }

    fn add_files(&mut self, file_set: FileSet) -> Result<()> {
        for relative in file_set.relative_paths {
            self.add_file(&file_set.base_dir, &relative)?;
        }
        Ok(())
    }

    /// Run the suffix-tree analysis and build a [`Report`].
    pub fn build_report(self) -> Report {
        let mut tree = SuffixTree::build(&self.hashes);
        tree.add_ignored_sequences(&self.hashes, &self.ignore_hashes);
        let exclude_ignored = self.index_config.max_fingerprint_file_count.is_some()
            || !self.ignore_hashes.is_empty();
        let result = tree.analyze(
            &self.hashes,
            self.index_config.min_length_match,
            self.index_config.keep_fragments,
            exclude_ignored,
            self.index_config.max_fingerprint_file_count,
        );
        Report::new(result, self.files, self.locations, self.report_config)
    }
}

impl fmt::Debug for Dolos {
    fn fmt(&self, fmt: &mut fmt::Formatter) -> fmt::Result {
        fmt.debug_struct("Dolos")
            .field("name", &self.report_config.name)
            .field("language", &self.index_config.language)
            .field("files", &self.files)
            .finish()
    }
}
