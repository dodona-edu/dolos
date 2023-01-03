use std::collections::HashMap;
use std::rc::Rc;

use crate::file::File;
use crate::winnowing::hashes::Hash;
use crate::winnowing::index::Occurrence;
use crate::winnowing::tokens::Fingerprint;

/// All the kgrams (fingeprints) with the same hash, grouped by the file they
/// are in. Note that a kgram can occurr mutliple times in a single file, hence
/// the Vec<Occurrence> for each file.
#[derive(Debug)]
pub struct SharedFingerprint {
    pub hash: Hash,
    pub parts: HashMap<Rc<File>, Vec<Occurrence>>,
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
