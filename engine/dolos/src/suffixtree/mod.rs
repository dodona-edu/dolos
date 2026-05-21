//! A generalized suffix tree implementation for finding matches between multiple sequences.
//!
//! This module provides a suffix tree that can be built from multiple sequences
//! and used to find maximal matches, calculate similarities, and search for patterns.

mod build_cursor;
mod match_collector;
mod maximal_match;
mod node;
pub(crate) mod tree;
mod tree_builder;
pub mod types;
