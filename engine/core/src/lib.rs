//! The computational core of Dolos. It compares sequences of symbols pairwise.
//!
//! [`analyze`] finds the exact matches between every pair of sequences: the
//! maximal matches, cut at ignored positions. It derives the [`PairMetrics`] of
//! each pair from them. A symbol is a [`Symbol`] (`usize`) value. What it
//! encodes is up to the caller.
//!
//! With the `wasm` feature, the crate also exports `analyze` to JavaScript.
//!
//! # Examples
//!
//! ```
//! use dolos_core::{AnalysisOptions, analyze};
//!
//! let sequences = vec![vec![1, 2, 3, 4, 5], vec![7, 2, 3, 4, 8]];
//! let options = AnalysisOptions { min_match_length: 2, keep_matches: true };
//! let result = analyze(&sequences, None, &options)?;
//!
//! assert_eq!(result.metrics()[(0, 1)].similarity, 0.6);
//! assert_eq!(result.matches().map(|m| m[(0, 1)].len()), Some(1));
//! # Ok::<(), std::io::Error>(())
//! ```

/// A single element of an input sequence.
///
/// `usize::MAX` is reserved as the end-of-sequence symbol. No input may contain it.
pub type Symbol = usize;

mod analysis;
mod collections;
mod ignore;
mod suffixtree;
mod validation;
#[cfg(feature = "wasm")]
mod wasm;

pub use analysis::{AnalysisOptions, analyze};
pub use collections::pair_array::PairArray;
pub use suffixtree::{AnalysisResult, Match, PairMetrics};
