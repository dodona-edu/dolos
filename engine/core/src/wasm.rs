//! The JavaScript binding for [`crate::analyze`].
//!
//! `#[wasm_bindgen]` exports only the `pub` methods of [`Analysis`], so the
//! private ones stay callable from the native tests.

use crate::{AnalysisOptions, AnalysisResult, PairMetrics, Symbol};
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
    #[wasm_bindgen(getter, js_name = sequenceCount)]
    pub fn sequence_count(&self) -> usize {
        self.0.metrics.item_count()
    }

    /// The number of pairs the analysis holds.
    #[wasm_bindgen(getter, js_name = pairCount)]
    pub fn pair_count(&self) -> usize {
        self.0.metrics.pair_count()
    }

    /// Whether the run kept the raw matches.
    #[wasm_bindgen(getter, js_name = hasMatches)]
    pub fn has_matches(&self) -> bool {
        self.0.matches.is_some()
    }

    /// The metrics of the pair `(left, right)`.
    ///
    /// @throws {Error} when `left` and `right` name no pair.
    pub fn metrics(&self, left: usize, right: usize) -> Result<Ts<PairMetrics>, JsError> {
        self.check_pair(left, right)?;

        Ok(self.0.metrics.get(left, right).into_ts()?)
    }

    /// The matches of the pair `(left, right)`.
    ///
    /// `undefined` when the run did not keep matches. Empty when the pair has
    /// none.
    ///
    /// @throws {Error} when `left` and `right` name no pair.
    #[wasm_bindgen(unchecked_return_type = "Match[] | undefined")]
    pub fn matches(&self, left: usize, right: usize) -> Result<JsValue, JsError> {
        self.check_pair(left, right)?;

        let matches = self
            .0
            .matches
            .as_ref()
            .map(|matches| matches.get(left, right));

        Ok(serde_wasm_bindgen::to_value(&matches)?)
    }

    /// Check that `(left, right)` names a pair, so no out-of-range index reaches
    /// [`PairArray`].
    ///
    /// [`PairArray`]: crate::PairArray
    fn check_pair(&self, left: usize, right: usize) -> io::Result<()> {
        if left == right {
            let message = format!("sequence {left} does not form a pair with itself");
            return Err(io::Error::new(io::ErrorKind::InvalidInput, message));
        }

        let count = self.0.metrics.item_count();
        if left >= count || right >= count {
            let message = format!(
                "pair ({left}, {right}) is out of range, the analysis has {count} sequences"
            );
            return Err(io::Error::new(io::ErrorKind::InvalidInput, message));
        }

        Ok(())
    }
}

/// Compare all sequences pairwise. The analysis finds the maximal exact matches
/// between every pair of sequences, and derives the similarity metrics of the pair from them.
/// With `keepMatches`, the result also holds the matches themselves.
///
/// @param sequences - The sequences to compare. There must be at least two, and
/// none of them may contain 4294967295.
/// @param ignored - One list of intervals per sequence, or `null` to ignore nothing.
/// Ignored positions are excluded entirely from the analysis.
/// @param options - The minimum match length, and whether to keep the matches.
///
/// @returns An `Analysis` that converts one pair per call. Release it with
/// `free()`, or declare it with `using`.
///
/// @throws {Error} when an argument does not match its type, or when the input is invalid.
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

#[cfg(test)]
mod tests {
    use super::*;

    /// An analysis over one sequence per string, one symbol per byte.
    fn analyse(inputs: &[&str], keep_matches: bool) -> Analysis {
        let sequences: Vec<Vec<Symbol>> = inputs
            .iter()
            .map(|s| s.bytes().map(Symbol::from).collect())
            .collect();
        let options = AnalysisOptions { min_match_length: 1, keep_matches };

        Analysis(crate::analyze(&sequences, None, &options).unwrap())
    }

    /// Both failing index shapes reach the caller as an error.
    #[test]
    fn check_pair_rejects_indices_that_name_no_pair() {
        let analysis = analyse(&["ABC", "ABC"], true);

        let same = analysis.check_pair(1, 1).unwrap_err();
        assert_eq!(same.kind(), io::ErrorKind::InvalidInput);
        assert!(
            same.to_string()
                .contains("does not form a pair with itself"),
            "{same}"
        );

        // The first index past the last sequence, so a `>` bound would let it by.
        let out_of_range = analysis.check_pair(0, 2).unwrap_err();
        assert_eq!(out_of_range.kind(), io::ErrorKind::InvalidInput);
        assert!(
            out_of_range.to_string().contains("is out of range"),
            "{out_of_range}"
        );
    }
}
