use crate::file::File;
use crate::language::Language;
use crate::tokenizer::Tokenizer;
use crate::winnowing::hashes::Hash;
use crate::winnowing::report::Report;
use crate::winnowing::tokens::{Fingerprint, Winnow};
use std::collections::hash_map::Entry;
use std::collections::HashMap;
use std::hash::{Hash as MapHash, Hasher};
use std::path::PathBuf;
use std::rc::Rc;

/// A single kgram (fingerprint) within a file
#[derive(Debug, Clone)]
pub struct Occurrence {
    file: Rc<File>,
    fingerprint: Fingerprint,
}

/// All the kgrams (fingeprints) with the same hash, grouped by the file they
/// are in. Note that a kgram can occurr mutliple times in a single file, hence
/// the Vec<Occurrence> for each file.
#[derive(Debug)]
pub struct SharedFingerprint {
    hash: Hash,
    parts: HashMap<Rc<File>, Vec<Occurrence>>,
}

impl SharedFingerprint {
    pub fn new(fingerprint: Fingerprint, file: Rc<File>) -> Self {
        let mut parts = HashMap::new();
        let hash = fingerprint.hash;
        let occurrence = Occurrence {
            file: file.clone(),
            fingerprint,
        };
        parts.insert(file.clone(), vec![occurrence]);
        Self { hash, parts }
    }

    pub fn add(&mut self, fingerprint: Fingerprint, file: Rc<File>) {
        let other = Occurrence {
            file: file.clone(),
            fingerprint,
        };
        self.parts
            .entry(file)
            .or_insert_with(|| Vec::new())
            .push(other);
    }
}

#[derive(Debug)]
pub struct Fragment {
    start: (usize, usize),
    end: (usize, usize),
    occurrences: (Vec<Occurrence>, Vec<Occurrence>),
}

impl MapHash for Fragment {
    fn hash<H>(&self, hasher: &mut H)
    where
        H: Hasher,
    {
        self.start.hash(hasher);
        self.end.hash(hasher);
    }
}

impl PartialEq for Fragment {
    fn eq(&self, other: &Self) -> bool {
        self.start == other.start && self.end == other.end
    }
}

impl Eq for Fragment {}

impl Fragment {
    pub fn extend_with(&mut self, other: &mut Fragment) {
        debug_assert!(self.end == other.start);
        self.end = other.end;
        self.occurrences.0.append(&mut other.occurrences.0);
        self.occurrences.1.append(&mut other.occurrences.1);
    }

    pub fn add_occurrence(&mut self, left: Occurrence, right: Occurrence) {
        debug_assert!(self.end == (left.fingerprint.index, right.fingerprint.index));
        self.end = (left.fingerprint.index + 1, right.fingerprint.index + 1);
        self.occurrences.0.push(left);
        self.occurrences.1.push(right);
    }
}

#[derive(Debug)]
pub struct Pair {
    pub left: Rc<File>,
    pub right: Rc<File>,
    by_start: HashMap<(usize, usize), Rc<Fragment>>,
    by_end: HashMap<(usize, usize), Rc<Fragment>>,
}

impl Pair {
    pub fn new(left: &Rc<File>, right: &Rc<File>) -> Self {
        Pair {
            left: left.clone(),
            right: right.clone(),
            by_start: HashMap::new(),
            by_end: HashMap::new(),
        }
    }

    /// Add all occurences of a kgram within this pair of files
    pub fn add(&mut self, left: &Vec<Occurrence>, right: &Vec<Occurrence>) {
        debug_assert!({
            let hash = left[0].fingerprint.hash;
            left.iter().all(|o| o.fingerprint.hash == hash)
                && right.iter().all(|o| o.fingerprint.hash == hash)
        });

        // TODO:  this is probably optimizable: by having just one fragment for
        // each kgram instead of creating one for each occurrence...
        for lo in left.iter() {
            for ro in right.iter() {
                let start = (lo.fingerprint.index, ro.fingerprint.index);
                let end = (lo.fingerprint.index + 1, ro.fingerprint.index + 1);
                let mut fragment = if let Some(mut existing) = self.by_end.remove(&start) {
                    self.by_start.remove(&existing.start);
                    Rc::get_mut(&mut existing)
                        .unwrap()
                        .add_occurrence(lo.clone(), ro.clone());
                    existing
                } else {
                    Rc::new(Fragment {
                        start,
                        end,
                        // TODO: cloning here, this might be an Rc as well?
                        occurrences: (vec![lo.clone()], vec![ro.clone()]),
                    })
                };

                // can we merge with the next fragment?
                if let Some(mut next) = self.by_start.remove(&end) {
                    self.by_end.remove(&next.end);

                    Rc::get_mut(&mut fragment)
                        .unwrap()
                        .extend_with(Rc::get_mut(&mut next).unwrap());
                }

                self.by_start.insert(fragment.start, fragment.clone());
                self.by_end.insert(fragment.end, fragment);
            }
        }
    }
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

        let file = Rc::new(self.tokenizer.parse(path));
        self.files.push(file.clone());

        let winnowed = file.tokens.winnow(self.k, self.w);
        for fingerprint in winnowed {
            dbg!(&fingerprint);
            match self.fingerprints.entry(fingerprint.hash) {
                Entry::Occupied(mut o) => {
                    o.get_mut().add(fingerprint, file.clone());
                }
                Entry::Vacant(v) => {
                    v.insert(SharedFingerprint::new(fingerprint, file.clone()));
                }
            };
        }
    }

    pub fn add_files(&mut self, paths: Vec<PathBuf>) {
        for path in paths {
            self.add_file(path);
        }
    }

    pub fn build_report(&self) -> Vec<Pair> {
        // TODO filter fingerprints
        let filtered = dbg!(self.fingerprints.values());
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

        pairs.into_values().collect()
    }
}
