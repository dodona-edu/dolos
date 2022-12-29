use crate::winnowing::index::Pair;

pub struct ScoredPair {
    pair: Pair,
    overlap: usize,
    longest: usize,
    similarity: usize,
    right: usize,
    left: usize,
}

pub struct Report {}
