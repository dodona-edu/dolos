use crate::winnowing::index::Occurrence;
use std::hash::{Hash as MapHash, Hasher};

#[derive(Debug, Clone)]
pub struct Fragment {
    pub start: (usize, usize),
    pub end: (usize, usize),
    pub occurrences: (Vec<Occurrence>, Vec<Occurrence>),
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
