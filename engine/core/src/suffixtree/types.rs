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

/// An exact match between the two sequences of a pair: a maximal match, cut at
/// ignored positions.
///
/// The left sequence is the one with the smaller index, the right sequence the
/// one with the larger index. The offsets are positions in the input
/// sequences, ignored positions included.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[cfg_attr(
    feature = "wasm",
    derive(serde::Serialize, tsify::Tsify),
    serde(rename_all = "camelCase")
)]
pub struct Match {
    /// Start offset in the left sequence.
    pub left_start: usize,
    /// Start offset in the right sequence.
    pub right_start: usize,
    /// The number of consecutive matching symbols.
    pub length: usize,
}

/// The similarity metrics of one pair of sequences.
///
/// The left sequence is the one with the smaller index, the right sequence the
/// one with the larger index. All counts are in symbols.
#[derive(Debug, Clone, Default, PartialEq)]
#[cfg_attr(
    feature = "wasm",
    derive(serde::Serialize, tsify::Tsify),
    serde(rename_all = "camelCase")
)]
pub struct PairMetrics {
    /// The sum of both overlaps divided by the sum of both totals, between 0
    /// and 1. 0 when both totals are 0.
    pub similarity: f64,
    /// Number of symbols in the left sequence, excluding ignored ones.
    pub total_left: usize,
    /// Number of symbols in the right sequence, excluding ignored ones.
    pub total_right: usize,
    /// Number of symbols in the left sequence covered by at least one match.
    pub overlap_left: usize,
    /// Number of symbols in the right sequence covered by at least one match.
    pub overlap_right: usize,
    /// The length of the longest match. 0 when the pair has no match.
    pub longest_match: usize,
}

/// The result of [`analyze`](crate::analyze): the metrics of every pair, and
/// optionally the matches of every pair.
///
/// Both are indexed by the positions of the sequences in the input.
#[derive(Debug, Clone, PartialEq)]
pub struct AnalysisResult {
    metrics: PairArray<PairMetrics>,
    matches: Option<PairArray<Vec<Match>>>,
}

impl AnalysisResult {
    pub(crate) fn new(
        metrics: PairArray<PairMetrics>,
        matches: Option<PairArray<Vec<Match>>>,
    ) -> Self {
        Self { metrics, matches }
    }

    /// Returns the metrics of every pair of sequences.
    ///
    /// # Examples
    ///
    /// ```
    /// # use dolos_core::{AnalysisOptions, analyze};
    /// # let options = AnalysisOptions { min_match_length: 1, keep_matches: false };
    /// let result = analyze(&[vec![1, 2, 3], vec![1, 2, 4]], None, &options)?;
    ///
    /// assert_eq!(result.metrics()[(0, 1)].longest_match, 2);
    /// # Ok::<(), std::io::Error>(())
    /// ```
    pub fn metrics(&self) -> &PairArray<PairMetrics> {
        &self.metrics
    }

    /// Returns the matches of every pair of sequences, in no specific order.
    /// `Some` only when [`keep_matches`](crate::AnalysisOptions::keep_matches)
    /// is set.
    ///
    /// # Examples
    ///
    /// ```
    /// # use dolos_core::{AnalysisOptions, analyze};
    /// let options = AnalysisOptions { min_match_length: 1, keep_matches: true };
    /// let result = analyze(&[vec![1, 2, 3], vec![1, 2, 4]], None, &options)?;
    ///
    /// let matches = result.matches().expect("keep_matches is set");
    /// assert_eq!(matches[(0, 1)].len(), 1);
    /// # Ok::<(), std::io::Error>(())
    /// ```
    pub fn matches(&self) -> Option<&PairArray<Vec<Match>>> {
        self.matches.as_ref()
    }
}
