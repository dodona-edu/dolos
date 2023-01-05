use crate::file::File;
use crate::language::Language;
use crate::tokenizer::{Tokenizer, Tokens};
use crate::winnowing::hashes::Hash;
use crate::winnowing::pair::Pair;
use crate::winnowing::report::Report;
use crate::winnowing::shared_fingerprint::SharedFingerprint;
use crate::winnowing::tokens::{Fingerprint, Winnow};
use std::collections::hash_map::Entry;
use std::collections::HashMap;
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
    pub language: Language,
    pub fingerprints: HashMap<Hash, SharedFingerprint>,
    tokenizer: Tokenizer,
}

impl Index {
    pub fn new(k: usize, w: usize, language: Language) -> Self {
        Index {
            k,
            w,
            files: Vec::new(),
            fingerprints: HashMap::new(),
            tokenizer: Tokenizer::new(language),
            language,
        }
    }

    pub fn add_file(&mut self, path: PathBuf) {
        if !self.language.matches(&path) {
            panic!("Language does not match")
        }

        let tree = self.tokenizer.parse(&path);
        let tokens = tree.tokens();
        let fingerprints = tokens.winnow(self.k, self.w);
        let file = Rc::new(File {
            path,
            fingerprints,
            language: self.language,
        });

        self.files.push(file.clone());

        for fingerprint in &file.fingerprints {
            match self.fingerprints.entry(fingerprint.hash) {
                Entry::Occupied(mut o) => {
                    o.get_mut().add(fingerprint.clone(), file.clone());
                }
                Entry::Vacant(v) => {
                    v.insert(SharedFingerprint::new(fingerprint.clone(), file.clone()));
                }
            };
        }
    }

    pub fn add_files(&mut self, paths: Vec<PathBuf>) {
        for path in paths {
            self.add_file(path);
        }
    }

    pub fn build_report(&self) -> Report {
        // TODO filter fingerprints
        let filtered = self.fingerprints.values();
        let mut pairs: HashMap<(Rc<File>, Rc<File>), Pair> = HashMap::new();

        for fingerprint in filtered {
            let parts: Vec<(&Rc<File>, &Vec<Occurrence>)> = fingerprint.parts.iter().collect();
            for (i, p1) in parts.iter().enumerate() {
                for p2 in parts[(i + 1)..].iter() {
                    let ((lf, lo), (rf, ro)) = if p1.0 < p2.0 { (p1, p2) } else { (p2, p1) };
                    if lf != rf {
                        let key = (lf.clone().to_owned(), rf.clone().to_owned());
                        pairs
                            .entry(key)
                            .or_insert_with(|| Pair::new(lf, rf))
                            .add(lo, ro);
                    }
                }
            }
        }

        Report::from(pairs.into_values())
    }
}
