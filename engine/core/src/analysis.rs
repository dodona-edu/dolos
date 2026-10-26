use crate::Symbol;
use crate::ignore::ignore_ranges_to_mask;
use crate::suffixtree::{AnalysisResult, SuffixTree};
use crate::validation::validate_input;
use std::ops::Range;

/// Options controlling an `analyze` run.
#[derive(Debug)]
#[cfg_attr(
    feature = "wasm",
    derive(serde::Deserialize, tsify::Tsify),
    serde(rename_all = "camelCase")
)]
pub struct AnalysisOptions {
    /// Minimum shared substring length, in symbols. At least 1.
    pub min_match_length: usize,
    /// Keep the raw matches of every pair.
    pub keep_matches: bool,
}

/// Compare all sequences pairwise. The analysis finds the maximal exact matches
/// between every pair of sequences, and derives the similarity metrics of the pair from them.
/// With `keep_matches`, the result also holds the matches themselves.
///
/// # Parameters
///
/// - `sequences`: the sequences to compare. There must be at least two, and
///   none of them may contain `usize::MAX`.
/// - `ignored`: one list of ranges per sequence, or `None` to ignore nothing.
///   Ignored positions are excluded entirely from the analysis.
/// - `options`: the minimum match length, and whether to keep the matches.
///
/// # Errors
///
/// Returns an [`ErrorKind::InvalidInput`](std::io::ErrorKind::InvalidInput)
/// error when the input is invalid.
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
/// assert_eq!(result.metrics.get(0, 1).longest_match, 3);
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
