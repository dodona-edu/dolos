use crate::file::File;
use crate::language::Language;
use crate::suffixtree::analysis::MaximalMatchAnalyzer;
use crate::suffixtree::tree::Tree;
use crate::suffixtree::tree_builder::{TreeBuilder, UkkonenBuilder};
use crate::tokenizer::{Tokenizer, Tokens};
use crate::winnowing::report::Report;
use crate::winnowing::tokens::{Fingerprint, Winnow};
use std::path::PathBuf;
use std::rc::Rc;

/// A single kgram (fingerprint) within a file
#[derive(Debug, Clone)]
pub struct Occurrence {
    pub file: Rc<File>,
    pub fingerprint: Fingerprint,
}

pub struct Index {
    pub k: usize,
    pub w: usize,
    pub files: Vec<Rc<File>>,
    data: Vec<Vec<usize>>,
    pub language: Language,
    tree: Tree,
    tokenizer: Tokenizer,
}

impl Index {
    pub fn new(k: usize, w: usize, language: Language) -> Self {
        Index {
            k,
            w,
            files: Vec::new(),
            data: Vec::new(),
            tree: Tree::new(),
            tokenizer: Tokenizer::new(language),
            language,
        }
    }

    pub fn tokenize_file(&mut self, path: PathBuf) {
        if !self.language.matches(&path) {
            panic!("Language does not match")
        }

        let tree = self.tokenizer.parse(&path);
        let tokens = tree.tokens();
        let mut fingerprints = tokens.winnow(self.k, self.w);
        fingerprints.push(usize::MAX);
        self.data.push(fingerprints);

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
        self.tree.add_words(&self.data, UkkonenBuilder::new());
    }

    pub fn build_report(&self) -> Report {
        let files = &self.files;
        let res = MaximalMatchAnalyzer::new(&self.tree, &self.data, 1).analyze();
        Report::from(res, files.clone())
    }
}
