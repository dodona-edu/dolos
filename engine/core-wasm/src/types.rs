//! JavaScript copies of the `dolos-core` types that cross the boundary.

use serde::{Deserialize, Serialize};
use tsify::Tsify;

/// The options of an `analyze` run.
#[derive(Debug, Clone, Copy, Deserialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub struct AnalysisOptions {
    /// The minimum length of a match, in symbols. Shorter matches are not
    /// recorded and do not count in the metrics. At least 1, see `analyze`.
    pub min_match_length: usize,
    /// Keep the matches of every pair in the result. Without it, the result
    /// holds only the metrics.
    pub keep_matches: bool,
}

impl From<AnalysisOptions> for dolos_core::AnalysisOptions {
    fn from(options: AnalysisOptions) -> Self {
        Self {
            min_match_length: options.min_match_length,
            keep_matches: options.keep_matches,
        }
    }
}

/// An exact match between the two sequences of a pair: a maximal match, cut at
/// ignored positions.
///
/// The left sequence is the one with the smaller index, the right sequence the
/// one with the larger index. The offsets are positions in the input
/// sequences, ignored positions included.
#[derive(Debug, Clone, Copy, Serialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub struct Match {
    /// Start offset in the left sequence.
    pub left_start: usize,
    /// Start offset in the right sequence.
    pub right_start: usize,
    /// The number of consecutive matching symbols.
    pub length: usize,
}

impl From<dolos_core::Match> for Match {
    fn from(found: dolos_core::Match) -> Self {
        Self {
            left_start: found.left_start,
            right_start: found.right_start,
            length: found.length,
        }
    }
}

/// The similarity metrics of one pair of sequences.
///
/// The left sequence is the one with the smaller index, the right sequence the
/// one with the larger index. All counts are in symbols.
#[derive(Debug, Clone, Serialize, Tsify)]
#[serde(rename_all = "camelCase")]
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

impl From<&dolos_core::PairMetrics> for PairMetrics {
    fn from(metrics: &dolos_core::PairMetrics) -> Self {
        Self {
            similarity: metrics.similarity,
            total_left: metrics.total_left,
            total_right: metrics.total_right,
            overlap_left: metrics.overlap_left,
            overlap_right: metrics.overlap_right,
            longest_match: metrics.longest_match,
        }
    }
}
