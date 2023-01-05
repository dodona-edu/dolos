use crate::winnowing::fragment::Fragment;
use crate::winnowing::pair::Pair;

use std::cmp::Ordering;

pub struct ScoredPair {
    pub pair: Pair,
    pub overlap: usize,
    pub longest: usize,
    pub similarity: f64,
    pub right: usize,
    pub left: usize,
}

impl ScoredPair {
    pub fn from(pair: Pair) -> Self {
        let fragments = pair.fragments();
        // TODO: this does not reflect the count of winnowed tokens, so
        // we might consider making this more accurate
        let total = pair.left.fingerprints.len() + pair.right.fingerprints.len();
        let (left, right) = Fragment::total_overlap(&fragments);
        let longest = fragments.iter().map(|f| f.len()).max().expect("empty pair");
        let overlap = left + right;
        ScoredPair {
            pair,
            overlap,
            longest,
            left,
            right,
            similarity: (overlap as f64) / (total as f64),
        }
    }
}

impl PartialEq for ScoredPair {
    fn eq(&self, other: &Self) -> bool {
        self.pair == other.pair
    }
}

impl Eq for ScoredPair {}

impl PartialOrd for ScoredPair {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for ScoredPair {
    fn cmp(&self, other: &Self) -> Ordering {
        other
            .similarity
            .total_cmp(&self.similarity)
            .then_with(|| self.pair.left.cmp(&other.pair.left))
            .then_with(|| self.pair.right.cmp(&other.pair.right))
    }
}

pub struct Report {
    pub pairs: Vec<ScoredPair>,
}

impl Report {
    pub fn from<I: Iterator<Item = Pair>>(pairs: I) -> Self {
        let mut pairs = pairs.map(ScoredPair::from).collect::<Vec<ScoredPair>>();
        pairs.sort();
        Report { pairs }
    }
}
