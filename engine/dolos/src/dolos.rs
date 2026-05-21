use crate::file::File;
use crate::opts::{IndexConfig, ReportConfig};
use crate::report::Report;
use crate::suffixtree::tree::SuffixTree;
use crate::winnowing::fingerprints::{Fingerprint, Winnow};
use crate::winnowing::region::Region;
use crate::winnowing::tokenizer::{Tokenizer, Tokens};
use std::fmt;
use std::path::PathBuf;
use std::rc::Rc;

pub struct Dolos {
    config: IndexConfig,
    files: Vec<Rc<File>>,
    hashes: Vec<Vec<Fingerprint>>,
    ignore_hashes: Vec<Vec<Fingerprint>>,
    locations: Option<Vec<Vec<Region>>>,
    tokenizer: Tokenizer,
}

impl Dolos {
    pub fn from_paths(paths: Vec<PathBuf>, config: IndexConfig) -> Self {
        let tokenizer = Tokenizer::new(config.language, config.include_comments);
        let locations = config.keep_fragments.then_some(Vec::new());
        let mut dolos = Dolos {
            config,
            files: Vec::new(),
            hashes: Vec::new(),
            ignore_hashes: Vec::new(),
            locations,
            tokenizer,
        };
        dolos.add_files(paths);

        // Ignore file is added after all regular files, so its word index is
        // always >= regular_word_count.
        if let Some(ignore_path) = dolos.config.ignore.clone() {
            dolos.add_ignore_file(ignore_path);
        }
        dolos
    }

    /// Parse `content` into a fingerprint sequence (and optionally per-fingerprint`
    /// source locations when `keep_locations` is `true`).
    fn fingerprint(
        &mut self,
        content: &str,
        keep_locations: bool,
    ) -> (Vec<Fingerprint>, Option<Vec<Region>>) {
        self.tokenizer
            .parse(content)
            .tokens(self.tokenizer.include_comments)
            .winnow(
                self.config.kgram_length,
                self.config.kgrams_in_window,
                keep_locations,
            )
    }

    /// Tokenize a source file and register it as a regular file in the analysis.
    ///
    /// The file is added to `self.files`, its fingerprints to `self.hashes`, and
    /// (when `keep_fragments` is set) its locations to `self.locations`.
    fn add_file(&mut self, path: PathBuf) {
        assert!(
            self.config.language.matches(&path),
            "Language does not match file: {}",
            path.display()
        );

        let content = std::fs::read_to_string(&path).expect("should be able to read file");
        let (hashes, locations) = self.fingerprint(&content, self.config.keep_fragments);

        self.hashes.push(hashes);
        if let Some(locs) = self.locations.as_mut() {
            locs.push(locations.expect("locations should be present when keep_fragments is true"));
        }
        self.files.push(Rc::new(File {
            path,
            content: self.config.keep_fragments.then_some(content),
        }));
    }

    /// Tokenize a template/ignore file and append its fingerprints to the hash
    /// list so that the suffix tree can suppress common matches.
    ///
    /// Ignore files are never added to `self.files` or `self.locations`: they
    /// do not appear in the report, and no fragment resolution is needed for them.
    fn add_ignore_file(&mut self, path: PathBuf) {
        let content = std::fs::read_to_string(&path)
            .unwrap_or_else(|_| panic!("Could not read ignore file: {}", path.display()));
        let (hashes, _) = self.fingerprint(&content, false);
        self.ignore_hashes.push(hashes);
    }

    fn add_files(&mut self, paths: Vec<PathBuf>) {
        for path in paths {
            self.add_file(path);
        }
    }

    pub fn build_report(self, report_config: ReportConfig) -> Report {
        let mut tree = SuffixTree::build(&self.hashes);
        tree.add_ignored_sequences(&self.hashes, &self.ignore_hashes);
        let result = tree.analyze(
            &self.hashes,
            self.config.min_length_match,
            self.config.keep_fragments,
            self.config.max_fingerprint_file_count.is_some() || !self.ignore_hashes.is_empty(),
            self.config.max_fingerprint_file_count,
        );
        Report::from(result, self.files, self.locations, report_config)
    }
}

impl fmt::Debug for Dolos {
    fn fmt(&self, fmt: &mut fmt::Formatter) -> fmt::Result {
        fmt.debug_struct("Dolos")
            .field("language", &self.config.language)
            .field("files", &self.files)
            .finish()
    }
}
