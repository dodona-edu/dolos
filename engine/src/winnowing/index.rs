use crate::file::File;
use crate::language::Language;
use crate::winnowing::hashes::Hash;
use crate::winnowing::tokens::{Fingerprint, Tokens};
use std::collections::HashMap;
use std::path::PathBuf;
use std::rc::Rc;
use tree_sitter::Parser;

struct Occurence {
    file: Rc<File>,
    fingerprint: Fingerprint,
}

pub struct Index {
    pub k: usize,
    pub w: usize,
    pub files: Vec<Rc<File>>,
    pub language: Language,
    parser: Parser,
    index: HashMap<Hash, Vec<Occurence>>,
}

impl Index {
    pub fn new(k: usize, w: usize, language: Language) -> Self {
        let mut parser = Parser::new();
        parser
            .set_language(language.tree_sitter_language())
            .expect("set language");
        Index {
            k,
            w,
            files: Vec::new(),
            index: HashMap::new(),
            parser,
            language,
        }
    }

    pub fn add_file(&mut self, path: PathBuf) {
        if !self.language.matches(&path) {
            panic!("Language does not match")
        }

        let content = File::read(&path).expect("content");
        let tree = self.parser.parse(content, None).expect("tree");

        let file = Rc::new(File {
            path,
            tree,
            language: self.language,
        });
        self.files.push(file.clone());

        let tokens = Tokens::from_tree(&file.tree);
        let fingerprints = tokens.winnow(self.k, self.w);
        for fingerprint in fingerprints {
            if let Some(occurences) = self.index.get_mut(&fingerprint.hash) {
                occurences.push(Occurence {
                    fingerprint,
                    file: file.clone(),
                })
            } else {
                self.index.insert(
                    fingerprint.hash,
                    vec![Occurence {
                        fingerprint,
                        file: file.clone(),
                    }],
                );
            }
        }
    }

    pub fn add_files(&mut self, paths: Vec<PathBuf>) {
        for path in paths {
            self.add_file(path);
        }
    }
}
