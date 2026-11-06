//! The JavaScript binding for [`crate::analyze`]: `analyze` for many
//! sequences, `analyzePair` for exactly two.
//!
//! `#[wasm_bindgen]` exports only the `pub` methods of [`Analysis`], so the
//! private ones stay callable from the native tests.

use crate::{AnalysisOptions, AnalysisResult, Match, PairMetrics, Symbol};
use serde::{Deserialize, Serialize};
use std::io;
use std::ops::Range;
use tsify::{Ts, Tsify};
use wasm_bindgen::prelude::*;

#[wasm_bindgen(typescript_custom_section)]
const INTERVAL: &str = r#"
/** A half-open range of positions, from `start` up to but not including `end`. */
export interface Interval { start: number; end: number; }
"#;

/// The result of one `analyze` run.
///
/// It holds the analysis in WebAssembly memory and converts one pair per call.
/// Release it with `free()`, or declare it with `using`.
#[wasm_bindgen]
#[derive(Debug)]
pub struct Analysis(AnalysisResult);

#[wasm_bindgen]
impl Analysis {
    /// The number of sequences the analysis covers.
    ///
    /// @example
    /// ```ts
    /// using analysis = analyze([[1, 2], [1, 2], [3]], null, { minMatchLength: 1, keepMatches: false });
    /// console.log(analysis.sequenceCount); // 3
    /// ```
    #[wasm_bindgen(getter, js_name = sequenceCount)]
    pub fn sequence_count(&self) -> usize {
        self.0.metrics().item_count()
    }

    /// The number of pairs the analysis holds: `n * (n - 1) / 2` for `n` sequences.
    ///
    /// @example
    /// ```ts
    /// using analysis = analyze([[1, 2], [1, 2], [3]], null, { minMatchLength: 1, keepMatches: false });
    /// console.log(analysis.pairCount); // 3
    /// ```
    #[wasm_bindgen(getter, js_name = pairCount)]
    pub fn pair_count(&self) -> usize {
        self.0.metrics().pair_count()
    }

    /// Whether the run kept the matches, as set by the `keepMatches` option.
    ///
    /// @example
    /// ```ts
    /// using analysis = analyze([[1, 2], [1, 2]], null, { minMatchLength: 1, keepMatches: true });
    /// console.log(analysis.hasMatches); // true
    /// ```
    #[wasm_bindgen(getter, js_name = hasMatches)]
    pub fn has_matches(&self) -> bool {
        self.0.matches().is_some()
    }

    /// The metrics of the pair of sequences `left` and `right`.
    ///
    /// The order of `left` and `right` does not matter. In the result, the left
    /// sequence is always the one with the smaller index.
    ///
    /// @param left - The index of one sequence of the pair.
    /// @param right - The index of the other sequence of the pair.
    /// @returns The similarity, totals, overlaps and longest match of the pair.
    /// @throws {Error} when `left` equals `right`, or when an index is not below
    /// `sequenceCount`.
    ///
    /// @example
    /// ```ts
    /// using analysis = analyze([[1, 2, 3], [1, 2, 4]], null, { minMatchLength: 1, keepMatches: false });
    /// console.log(analysis.metrics(0, 1).longestMatch); // 2
    /// ```
    pub fn metrics(&self, left: usize, right: usize) -> Result<Ts<PairMetrics>, JsError> {
        Ok(self.pair_metrics(left, right)?.into_ts()?)
    }

    /// The matches of the pair of sequences `left` and `right`.
    ///
    /// The order of `left` and `right` does not matter. In each match, the left
    /// sequence is always the one with the smaller index. The matches are sorted
    /// by `leftStart`, then `rightStart`, then `length`.
    ///
    /// @param left - The index of one sequence of the pair.
    /// @param right - The index of the other sequence of the pair.
    /// @returns The matches of the pair. `undefined` when the run did not keep
    /// matches. Empty when the pair has none.
    /// @throws {Error} when `left` equals `right`, or when an index is not below
    /// `sequenceCount`.
    ///
    /// @example
    /// ```ts
    /// using analysis = analyze([[1, 2, 3], [9, 1, 2]], null, { minMatchLength: 1, keepMatches: true });
    /// console.log(analysis.matches(0, 1)); // [{ leftStart: 0, rightStart: 1, length: 2 }]
    /// ```
    #[wasm_bindgen(unchecked_return_type = "Match[] | undefined")]
    pub fn matches(&self, left: usize, right: usize) -> Result<JsValue, JsError> {
        // Reject indices that name no pair, also when the run kept no matches.
        self.pair_metrics(left, right)?;

        let matches = self
            .0
            .matches()
            .and_then(|matches| matches.get(left, right));

        Ok(serde_wasm_bindgen::to_value(&matches)?)
    }

    /// The metrics of the pair `(left, right)`, or an error when the indices
    /// name no pair.
    fn pair_metrics(&self, left: usize, right: usize) -> io::Result<&PairMetrics> {
        let metrics = self.0.metrics();
        metrics.get(left, right).ok_or_else(|| {
            let count = metrics.item_count();
            let message = if left == right {
                format!("sequence {left} does not form a pair with itself")
            } else {
                format!(
                    "pair ({left}, {right}) is out of range, the analysis has {count} sequences"
                )
            };
            io::Error::new(io::ErrorKind::InvalidInput, message)
        })
    }
}

/// Compare all sequences pairwise.
///
/// The analysis finds the exact matches between every pair of sequences: the
/// maximal matches, cut at ignored positions. It derives the similarity metrics
/// of the pair from them. With `keepMatches`, the result also holds the matches
/// themselves.
///
/// @param sequences - The sequences to compare. There must be at least two.
/// Every symbol is a non-negative integer below 4294967295.
/// @param ignored - One list of intervals per sequence, or `null` to ignore
/// nothing. Intervals may be empty, overlap and come in any order. No match
/// covers an ignored position, and ignored positions do not count in the totals.
/// @param options - The minimum match length, and whether to keep the matches.
///
/// @returns An `Analysis` that converts one pair per call. Release it with
/// `free()`, or declare it with `using`.
///
/// @throws {Error} when an argument does not match its type, or when the input
/// breaks a rule: fewer than two sequences, a `minMatchLength` of 0, a sequence
/// that contains 4294967295, an `ignored` list without exactly one entry per
/// sequence, or an interval that starts after it ends or ends past the length
/// of its sequence.
///
/// @example
/// ```ts
/// using analysis = analyze([[1, 2, 3, 4], [9, 2, 3, 4]], null, {
///   minMatchLength: 2,
///   keepMatches: false,
/// });
///
/// console.log(analysis.metrics(0, 1).longestMatch); // 3
/// ```
#[wasm_bindgen]
pub fn analyze(
    #[wasm_bindgen(unchecked_param_type = "number[][]")] sequences: JsValue,
    #[wasm_bindgen(unchecked_param_type = "Interval[][] | null")] ignored: JsValue,
    options: Ts<AnalysisOptions>,
) -> Result<Analysis, JsError> {
    let options = options.to_rust()?;
    let sequences: Vec<Vec<Symbol>> = serde_wasm_bindgen::from_value(sequences)?;
    let ignored: Option<Vec<Vec<Range<usize>>>> = serde_wasm_bindgen::from_value(ignored)?;

    Ok(Analysis(crate::analyze(
        &sequences,
        ignored.as_deref(),
        &options,
    )?))
}

/// One sequence of an `analyzePair` call.
#[derive(Debug, Deserialize, Tsify)]
pub struct PairSequence {
    /// The symbols of the sequence. Every symbol is a non-negative integer
    /// below 4294967295.
    #[tsify(type = "number[]")]
    fingerprints: Vec<Symbol>,
    /// The intervals of positions to leave out. Pass `[]` to ignore nothing.
    #[tsify(type = "Interval[]")]
    ignored: Vec<Range<usize>>,
}

/// The options of an `analyzePair` call.
#[derive(Debug, Deserialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub struct PairOptions {
    /// The minimum length of a match, in symbols. Shorter matches are not
    /// recorded and do not count in the metrics. At least 1.
    min_match_length: usize,
}

/// The result of an `analyzePair` call.
#[derive(Debug, Serialize, Tsify)]
pub struct PairResult {
    /// The similarity, totals, overlaps and longest match of the pair.
    metrics: PairMetrics,
    /// The matches of the pair, sorted by `leftStart`, then `rightStart`, then
    /// `length`. Empty when the pair has none.
    matches: Vec<Match>,
}

/// Compare two sequences and return their metrics and matches as plain data.
///
/// @param left - The left sequence of the pair.
/// @param right - The right sequence of the pair.
/// @param options - The minimum match length.
///
/// @returns The metrics and the matches of the pair.
///
/// @throws {Error} when an argument does not match its type, or when the input
/// breaks a rule of `analyze`. Errors name `left` as sequence 0 and `right` as
/// sequence 1.
///
/// @example
/// ```ts
/// const { metrics, matches } = analyzePair(
///   { fingerprints: [1, 2, 3, 4], ignored: [] },
///   { fingerprints: [9, 2, 3, 4], ignored: [{ start: 3, end: 4 }] },
///   { minMatchLength: 2 },
/// );
///
/// console.log(metrics.longestMatch); // 2
/// console.log(matches); // [{ leftStart: 1, rightStart: 1, length: 2 }]
/// ```
#[wasm_bindgen(js_name = analyzePair)]
pub fn analyze_pair(
    left: Ts<PairSequence>,
    right: Ts<PairSequence>,
    options: Ts<PairOptions>,
) -> Result<Ts<PairResult>, JsError> {
    let (left, right) = (left.to_rust()?, right.to_rust()?);
    let sequences = [left.fingerprints, right.fingerprints];
    let ignored = [left.ignored, right.ignored];
    let options = AnalysisOptions {
        min_match_length: options.to_rust()?.min_match_length,
        keep_matches: true,
    };

    let result = crate::analyze(&sequences, Some(&ignored), &options)?;
    let matches = result
        .matches()
        .map(|matches| matches[(0, 1)].clone())
        .unwrap_or_default();
    let pair = PairResult { metrics: result.metrics()[(0, 1)].clone(), matches };

    Ok(pair.into_ts()?)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// An analysis over one sequence per string, one symbol per byte.
    fn run_analysis(inputs: &[&str], keep_matches: bool) -> Analysis {
        let sequences: Vec<Vec<Symbol>> = inputs
            .iter()
            .map(|s| s.bytes().map(Symbol::from).collect())
            .collect();
        let options = AnalysisOptions { min_match_length: 1, keep_matches };

        Analysis(crate::analyze(&sequences, None, &options).unwrap())
    }

    #[test]
    fn pair_metrics_rejects_indices_that_name_no_pair() {
        let analysis = run_analysis(&["ABC", "ABC"], true);

        let same = analysis.pair_metrics(1, 1).unwrap_err();
        assert_eq!(same.kind(), io::ErrorKind::InvalidInput);
        assert!(
            same.to_string()
                .contains("does not form a pair with itself"),
            "{same}"
        );

        // The first index past the last sequence, so a `>` bound would let it by.
        let out_of_range = analysis.pair_metrics(0, 2).unwrap_err();
        assert_eq!(out_of_range.kind(), io::ErrorKind::InvalidInput);
        assert!(
            out_of_range.to_string().contains("is out of range"),
            "{out_of_range}"
        );
    }
}
