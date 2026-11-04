use crate::Symbol;
use crate::ignore::ignore_ranges_to_mask;
use crate::suffixtree::{AnalysisResult, SuffixTree};
use crate::validation::validate_input;
use std::ops::Range;

/// The options of an `analyze` run.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[cfg_attr(
    feature = "wasm",
    derive(serde::Deserialize, tsify::Tsify),
    serde(rename_all = "camelCase")
)]
pub struct AnalysisOptions {
    /// The minimum length of a match, in symbols. Shorter matches are not
    /// recorded and do not count in the metrics. At least 1, see `analyze`.
    pub min_match_length: usize,
    /// Keep the matches of every pair in the result. Without it, the result
    /// holds only the metrics.
    pub keep_matches: bool,
}

/// Compare all sequences pairwise.
///
/// The analysis finds the exact matches between every pair of sequences: the
/// maximal matches, cut at ignored positions. It derives the
/// [`PairMetrics`](crate::PairMetrics) of the pair from them. With
/// [`keep_matches`](AnalysisOptions::keep_matches), the result also holds the
/// matches themselves.
///
/// # Parameters
///
/// - `sequences`: the sequences to compare.
/// - `ignored`: one list of ranges per sequence, or `None` to ignore nothing.
///   A range is half-open and indexes the positions of its sequence. Ranges may
///   be empty, overlap and come in any order. No match covers an ignored
///   position, and ignored positions do not count in the totals.
/// - `options`: the minimum match length, and whether to keep the matches.
///
/// # Errors
///
/// Returns an [`ErrorKind::InvalidInput`](std::io::ErrorKind::InvalidInput)
/// error for the first rule that the input breaks:
///
/// - `sequences` holds fewer than two sequences.
/// - [`min_match_length`](AnalysisOptions::min_match_length) is 0.
/// - A sequence contains `usize::MAX`.
/// - `ignored` does not hold exactly one list per sequence.
/// - An ignored range starts after it ends, or ends past the length of its
///   sequence.
///
/// # Examples
///
/// ```
/// use dolos_core::{AnalysisOptions, analyze};
///
/// let sequences = vec![vec![1, 2, 3, 4], vec![9, 2, 3, 4]];
/// let options = AnalysisOptions {
///     min_match_length: 2,
///     keep_matches: false,
/// };
///
/// let result = analyze(&sequences, None, &options)?;
/// assert_eq!(result.metrics()[(0, 1)].longest_match, 3);
/// # Ok::<(), std::io::Error>(())
/// ```
pub fn analyze(
    sequences: &[Vec<Symbol>],
    ignored: Option<&[Vec<Range<usize>>]>,
    options: &AnalysisOptions,
) -> std::io::Result<AnalysisResult> {
    validate_input(sequences, ignored, options)?;

    let lengths: Vec<usize> = sequences.iter().map(Vec::len).collect();
    let mask = ignored.and_then(|ignored| ignore_ranges_to_mask(ignored, &lengths));
    let tree = SuffixTree::build(sequences);

    Ok(tree.analyze(
        sequences,
        mask.as_ref(),
        options.min_match_length,
        options.keep_matches,
    ))
}
