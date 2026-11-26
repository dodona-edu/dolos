//! A generalized suffix tree over several sequences, and the maximal match
//! analysis on it.

mod build_cursor;
mod match_collector;
mod maximal_match;
mod node;
mod tree;
mod tree_builder;
mod types;

pub use tree::SuffixTree;
pub use types::{AnalysisResult, Match, PairMetrics, SENTINEL_SYMBOL};
