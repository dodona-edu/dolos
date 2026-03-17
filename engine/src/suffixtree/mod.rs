//! A generalized suffix tree implementation for finding matches between multiple words.
//!
//! This module provides a suffix tree that can be built from multiple words
//! and used to find maximal matches, calculate similarities, and search for patterns.

mod build_cursor;
mod match_collector;
mod maximal_match;
mod node;
pub(crate) mod suffixtree;
mod tree_builder;
pub(crate) mod types;
