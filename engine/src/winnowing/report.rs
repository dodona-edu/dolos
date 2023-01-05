use crate::winnowing::fragment::Fragment;
use crate::winnowing::pair::Pair;

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
        let total = pair.left.tokens.len() + pair.right.tokens.len();
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

pub struct Report {
    pub pairs: Vec<ScoredPair>,
}

impl Report {
    pub fn from<I: Iterator<Item = Pair>>(pairs: I) -> Self {
        Report {
            pairs: pairs.map(ScoredPair::from).collect(),
        }
    }
}
