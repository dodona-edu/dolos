//! A generalized suffix tree implementation for finding matches between multiple sequences.
//!
//! This module provides a suffix tree that can be built from multiple sequences
//! and used to find maximal matches, calculate similarities, and search for patterns.

mod build_cursor;
mod match_collector;
mod maximal_match;
mod node;
mod tree;
mod tree_builder;
mod types;

pub use tree::SuffixTree;
pub use types::{AnalysisResult, Match, PairMetrics};
