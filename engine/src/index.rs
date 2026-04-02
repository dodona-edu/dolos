use crate::file::File;
use crate::language::Language;
use crate::report::Report;
use crate::suffixtree::suffixtree::SuffixTree;
use crate::winnowing::fingerprints::{Fingerprints, Winnow};
use crate::winnowing::tokenizer::{Tokenizer, Tokens};
use std::path::PathBuf;
use std::rc::Rc;

pub struct Index {
    pub k: usize,
    pub w: usize,
    min_match_length: usize,
    pub files: Vec<Rc<File>>,
    fingerprints: Vec<Fingerprints>,
    pub language: Language,
    tokenizer: Tokenizer,
}

impl Index {
    pub fn new(k: usize, w: usize, min_match_length: usize, language: Language) -> Self {
        Index {
            k,
            w,
            min_match_length,
            files: Vec::new(),
            fingerprints: Vec::new(),
            tokenizer: Tokenizer::new(language),
            language,
        }
    }

    pub fn tokenize_file(&mut self, path: PathBuf) {
        if !self.language.matches(&path) {
            panic!("Language does not match")
        }

        let content = std::fs::read_to_string(&path).expect("should be able to read file");
        let fingerprints = self
            .tokenizer
            .parse(&content)
            .tokens()
            .winnow(self.k, self.w);
        self.fingerprints.push(fingerprints);

        let file = Rc::new(File {
            path,
            language: self.language,
            content: Some(content),
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
        let keep_fragments = self.files.len() == 2;

        // Separate hashes from locations by consuming the fingerprints.
        let (hashes, locations): (Vec<Vec<_>>, Vec<Vec<_>>) = self
            .fingerprints
            .into_iter()
            .map(|f| (f.hashes, f.locations))
            .unzip();

        let tree = SuffixTree::new(&hashes);
        let result = tree.analyze(&hashes, self.min_match_length, keep_fragments);
        let locations = keep_fragments.then_some(locations);
        Report::from(result, self.files, locations)
    }
}
