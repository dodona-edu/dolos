#[cfg(test)]
use serde::{Deserialize, Serialize};
use tree_sitter;

#[cfg_attr(test, derive(Serialize, Deserialize))]
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct Point {
    pub row: usize,
    pub column: usize,
}

impl Point {
    pub fn new(row: usize, column: usize) -> Self {
        Point { row, column }
    }

    /// Convert a tree-sitter position.
    pub(crate) fn from_tree_sitter(point: tree_sitter::Point) -> Self {
        Point::new(point.row, point.column)
    }
}

/// A range of positions in a multi-line text document, both in terms of bytes
/// and of rows and columns.
#[cfg_attr(test, derive(Serialize, Deserialize))]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct Region {
    pub start_point: Point, // inclusive
    pub end_point: Point,   // exclusive
}

impl Region {
    pub fn new(start_point: Point, end_point: Point) -> Self {
        Region { start_point, end_point }
    }

    /// Create a region that spans from the start of `first` to the end of `last`.
    pub(crate) fn span(first: &Region, last: &Region) -> Self {
        Region::new(first.start_point, last.end_point)
    }
}
