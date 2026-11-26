#[cfg(test)]
use serde::{Deserialize, Serialize};

/// A position in a text document.
#[cfg_attr(test, derive(Serialize, Deserialize))]
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct Point {
    /// The zero-based line number.
    pub row: usize,
    /// The zero-based byte offset in the line.
    pub column: usize,
}

impl Point {
    /// Create a point.
    ///
    /// # Parameters
    ///
    /// - `row`: the zero-based line number.
    /// - `column`: the zero-based byte offset in the line.
    ///
    /// # Examples
    ///
    /// ```
    /// use dolos::Point;
    ///
    /// let point = Point::new(2, 4);
    /// assert_eq!(point.row, 2);
    /// ```
    pub fn new(row: usize, column: usize) -> Self {
        Point { row, column }
    }

    /// Convert a tree-sitter position.
    pub(crate) fn from_tree_sitter(point: tree_sitter::Point) -> Self {
        Point::new(point.row, point.column)
    }
}

/// A range of positions in a text document.
#[cfg_attr(test, derive(Serialize, Deserialize))]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct Region {
    /// The first position in the region.
    pub start_point: Point,
    /// The first position after the region.
    pub end_point: Point,
}

impl Region {
    /// Create a region from `start_point` up to but not including `end_point`.
    ///
    /// # Parameters
    ///
    /// - `start_point`: the first position in the region.
    /// - `end_point`: the first position after the region.
    ///
    /// # Examples
    ///
    /// ```
    /// use dolos::{Point, Region};
    ///
    /// let region = Region::new(Point::new(0, 0), Point::new(1, 5));
    /// assert_eq!(region.end_point, Point::new(1, 5));
    /// ```
    pub fn new(start_point: Point, end_point: Point) -> Self {
        Region { start_point, end_point }
    }

    /// Create a region that spans from the start of `first` to the end of `last`.
    pub(crate) fn span(first: &Region, last: &Region) -> Self {
        Region::new(first.start_point, last.end_point)
    }
}
