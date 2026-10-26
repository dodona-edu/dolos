//! The pure computational core of Dolos: a generalized suffix tree,
//! maximal-exact-match analysis, and pairwise similarity metrics.
//!
//! It operates on sequences of symbols, which are represented as `usize` values.
//! What they encode is up to the caller.

/// A single element of an input sequence.
///
/// `usize::MAX` is reserved: the tree appends it as an end-of-sequence
/// sentinel, so no input may contain it.
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
