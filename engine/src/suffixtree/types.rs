use crate::collections::pair_array::PairArray;

/// Sentinel symbol used to mark the end of words.
pub(crate) const SENTINEL_SYMBOL: SymbolType = usize::MAX;

/// Type that represents the index of a node in the arena part of the tree.
pub(super) type NodeIndex = usize;

/// Type that represents a single symbol in a word.
pub(super) type SymbolType = usize;

/// Represents a starting position of a match in a word.
#[derive(Debug, Clone)]
pub struct StartPosition {
    /// Index of the word this position belongs to.
    pub word_index: usize,
    /// Offset within the word where the match starts.
    pub start: usize,
}

/// A maximal exact match between two positions in (possibly different) words.
#[derive(Debug, Clone)]
pub struct Match {
    pub pos1: StartPosition,
    pub pos2: StartPosition,
    pub length: usize,
}

impl Match {
    pub fn new(pos1: StartPosition, pos2: StartPosition, length: usize) -> Match {
        Match { pos1, pos2, length }
    }
}

/// Result of the suffix-tree analysis containing similarity metrics for all
/// input pairs.
#[derive(Debug)]
pub struct AnalysisResult {
    /// Similarity scores between pairs of inputs (indexed as [i1][i2] where i1 < i2).
    pub similarities: PairArray<f64>,
    /// Length of the longest common substring between pairs.
    pub longest_fragments: PairArray<usize>,
    /// Raw matches from the suffix tree (consumed during report construction).
    pub matches: Option<PairArray<Vec<Match>>>,
}
