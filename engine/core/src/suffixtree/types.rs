use crate::Symbol;
use crate::collections::pair_array::PairArray;

/// Sentinel symbol used to mark the end of sequences.
pub const SENTINEL_SYMBOL: Symbol = usize::MAX;

/// Type that represents the index of a node in the arena part of the tree.
pub type NodeIndex = usize;

/// Represents a starting position of a match in a sequence.
///
/// Internal to the suffix-tree module; public consumers use [`Match`] which
/// stores only the normalized start offsets.
#[derive(Debug, Clone)]
pub struct StartPosition {
    /// Index of the sequence this position belongs to.
    pub sequence_index: usize,
    /// Offset within the sequence where the match starts.
    pub start: usize,
}

impl StartPosition {
    /// The same position moved `delta` symbols forward.
    pub fn shifted(&self, delta: usize) -> Self {
        Self {
            sequence_index: self.sequence_index,
            start: self.start + delta,
        }
    }
}

/// A maximal exact match between two positions in (possibly different) sequences.
///
/// `left_start` and `right_start` are offsets into the left (smaller-index)
/// and right (larger-index) sequence respectively. The owning [`PairArray`]
/// tracks *which* sequences the pair refers to.
#[derive(Debug, Clone, PartialEq)]
pub struct Match {
    /// Start offset in the left sequence.
    pub left_start: usize,
    /// Start offset in the right sequence.
    pub right_start: usize,
    /// Number of consecutive matching symbols.
    pub length: usize,
}

/// Per-pair metrics produced by the suffix-tree analysis.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct PairMetrics {
    /// Jaccard-style similarity: `(overlap_left + overlap_right) / (total_left + total_right)`.
    pub similarity: f64,
    /// Number of symbols in the left sequence, excluding ignored ones.
    pub total_left: usize,
    /// Number of symbols in the right sequence, excluding ignored ones.
    pub total_right: usize,
    /// Number of symbols in the left sequence covered by at least one match.
    pub overlap_left: usize,
    /// Number of symbols in the right sequence covered by at least one match.
    pub overlap_right: usize,
    /// Length of the longest common substring (in symbols).
    pub longest_match: usize,
}

/// Result of the suffix-tree analysis containing all per-pair metrics.
#[derive(Debug)]
pub struct AnalysisResult {
    /// All per-pair metrics (similarity, totals, overlaps, longest match).
    pub metrics: PairArray<PairMetrics>,
    /// Raw matches from the suffix tree (consumed during report construction).
    pub matches: Option<PairArray<Vec<Match>>>,
}
