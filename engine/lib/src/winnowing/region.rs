#[cfg(test)]
use serde::{Deserialize, Serialize};
use tree_sitter;

#[cfg_attr(test, derive(Serialize, Deserialize))]
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub struct Point {
    pub row: usize,
    pub column: usize,
}

impl Point {
    pub fn new(row: usize, column: usize) -> Self {
        Point { row, column }
    }
}

impl From<tree_sitter::Point> for Point {
    fn from(point: tree_sitter::Point) -> Self {
        Point::new(point.row, point.column)
    }
}

/// A range of positions in a multi-line text document, both in terms of bytes
/// and of rows and columns.
#[cfg_attr(test, derive(Serialize, Deserialize))]
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Region {
    pub start_point: Point, // inclusive
    pub end_point: Point,   // exclusive
}

impl Region {
    pub fn new(start_point: Point, end_point: Point) -> Self {
        Region { start_point, end_point }
    }

    pub fn is_empty(&self) -> bool {
        self.start_point == self.end_point
    }

    /// Create a region that spans from the start of `first` to the end of `last`.
    pub fn span(first: &Region, last: &Region) -> Self {
        Region::new(first.start_point, last.end_point)
    }
}
