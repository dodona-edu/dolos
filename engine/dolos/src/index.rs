use crate::file::File;
use crate::report::Report;
use crate::suffixtree::tree::SuffixTree;
use crate::tokenizer::{Tokenizer, Tokens};
use crate::winnowing::tokens::{Fingerprint, Winnow};
use std::path::PathBuf;
use std::rc::Rc;
use tree_sitter_grammars::Language;

pub struct Index {
    pub k: usize,
    pub w: usize,
    min_match_length: usize,
    pub files: Vec<Rc<File>>,
    data: Vec<Vec<Fingerprint>>,
    pub language: Language,
    tokenizer: Tokenizer,
    tree: Option<SuffixTree>,
}

impl Index {
    pub fn new(k: usize, w: usize, min_match_length: usize, language: Language) -> Self {
        Index {
            k,
            w,
            min_match_length,
            files: Vec::new(),
            data: Vec::new(),
            tokenizer: Tokenizer::new(language),
            language,
            tree: None,
        }
    }

    pub fn tokenize_file(&mut self, path: PathBuf) {
        if !self.language.matches(&path) {
            panic!("Language does not match")
        }

        self.data
            .push(self.tokenizer.parse(&path).tokens().winnow(self.k, self.w));

        let file = Rc::new(File {
            path,
            language: self.language,
        });

        self.files.push(file);
    }

    pub fn add_files(&mut self, paths: Vec<PathBuf>) {
        for path in paths {
            self.tokenize_file(path);
        }
        self.tree = Some(SuffixTree::new(&self.data));
    }

    /// Consume the index and produce a report.
    pub fn build_report(self) -> Report {
        let tree = self
            .tree
            .expect("add_files must be called before build_report");
        let result = tree.analyze(&self.data, self.min_match_length);
        Report::from(result, self.files)
    }
}
