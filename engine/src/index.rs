use crate::file::File;
use crate::language::Language;
use crate::report::Report;
use crate::suffixtree::tree::SuffixTree;
use crate::winnowing::fingerprints::{Fingerprint, Winnow};
use crate::winnowing::region::Region;
use crate::winnowing::tokenizer::{Tokenizer, Tokens};
use std::path::PathBuf;
use std::rc::Rc;

pub struct Index {
    pub k: usize,
    pub w: usize,
    pub keep_fragments: bool,
    min_match_length: usize,
    pub files: Vec<Rc<File>>,
    hashes: Vec<Vec<Fingerprint>>,
    locations: Option<Vec<Vec<Region>>>,
    pub language: Language,
    tokenizer: Tokenizer,
}

impl Index {
    pub fn new(
        k: usize,
        w: usize,
        keep_fragments: bool,
        min_match_length: usize,
        language: Language,
    ) -> Self {
        Index {
            k,
            w,
            keep_fragments,
            min_match_length,
            files: Vec::new(),
            hashes: Vec::new(),
            locations: keep_fragments.then_some(Vec::new()),
            tokenizer: Tokenizer::new(language),
            language,
        }
    }

    pub fn tokenize_file(&mut self, path: PathBuf) {
        if !self.language.matches(&path) {
            panic!("Language does not match")
        }

        let content = std::fs::read_to_string(&path).expect("should be able to read file");
        let (hashes, locations) =
            self.tokenizer
                .parse(&content)
                .tokens()
                .winnow(self.k, self.w, self.keep_fragments);

        self.hashes.push(hashes);
        if let Some(locs) = self.locations.as_mut() {
            locs.push(locations.expect("locations should be present when keep_fragments is true"));
        }

        let file = Rc::new(File {
            path,
            language: self.language,
            content: self.keep_fragments.then_some(content),
        });

        self.files.push(file);
    }

    pub fn add_files(&mut self, paths: Vec<PathBuf>) {
        for path in paths {
            self.tokenize_file(path);
        }
    }

    /// Consume the index and produce a report.
    pub fn build_report(self) -> Report {
        let tree = SuffixTree::new(&self.hashes);
        let result = tree.analyze(&self.hashes, self.min_match_length, self.keep_fragments);
        Report::from(result, self.files, self.locations)
    }
}
