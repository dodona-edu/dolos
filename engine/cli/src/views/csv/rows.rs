use dolos::{File, Fragment, Pair, Point};
use serde::Serialize;
use std::borrow::Cow;

/// One row of `metadata.csv`.
#[derive(Serialize)]
pub struct MetadataRow<'a> {
    property: &'a str,
    value: &'a str,
}

impl<'a> MetadataRow<'a> {
    pub const HEADER: [&'static str; 2] = ["property", "value"];

    pub fn new(property: &'a str, value: &'a str) -> Self {
        Self { property, value }
    }
}

/// One row of `files.csv`.
#[derive(Serialize)]
pub struct FileRow<'a> {
    id: usize,
    path: Cow<'a, str>,
    content: &'a str,
}

impl<'a> FileRow<'a> {
    pub const HEADER: [&'static str; 3] = ["id", "path", "content"];

    pub fn new(file: &'a File) -> Self {
        Self {
            id: file.id,
            path: file.relative_path.to_string_lossy(),
            content: &file.content,
        }
    }
}

/// One row of `pairs.csv`.
#[derive(Serialize)]
pub struct PairRow<'a> {
    file1_id: usize,
    file1_path: Cow<'a, str>,
    file2_id: usize,
    file2_path: Cow<'a, str>,
    similarity: f64,
    longest: usize,
    total_left: usize,
    total_right: usize,
    overlap_left: usize,
    overlap_right: usize,
}

impl<'a> PairRow<'a> {
    pub const HEADER: [&'static str; 10] = [
        "file1_id",
        "file1_path",
        "file2_id",
        "file2_path",
        "similarity",
        "longest",
        "total_left",
        "total_right",
        "overlap_left",
        "overlap_right",
    ];

    pub fn new(pair: &'a Pair) -> Self {
        Self {
            file1_id: pair.left_file.id,
            file1_path: pair.left_file.relative_path.to_string_lossy(),
            file2_id: pair.right_file.id,
            file2_path: pair.right_file.relative_path.to_string_lossy(),
            similarity: pair.metrics.similarity,
            longest: pair.metrics.longest_fragment,
            total_left: pair.metrics.total_left,
            total_right: pair.metrics.total_right,
            overlap_left: pair.metrics.overlap_left,
            overlap_right: pair.metrics.overlap_right,
        }
    }
}

/// One row of `fragments.csv`: a fragment together with the pair it belongs to.
#[derive(Serialize)]
pub struct FragmentRow<'a> {
    file1_id: usize,
    file1_path: Cow<'a, str>,
    file1_start_point: String,
    file1_end_point: String,
    file2_id: usize,
    file2_path: Cow<'a, str>,
    file2_start_point: String,
    file2_end_point: String,
    fingerprint_count: usize,
}

impl<'a> FragmentRow<'a> {
    pub const HEADER: [&'static str; 9] = [
        "file1_id",
        "file1_path",
        "file1_start_point",
        "file1_end_point",
        "file2_id",
        "file2_path",
        "file2_start_point",
        "file2_end_point",
        "fingerprint_count",
    ];

    pub fn new(pair: &'a Pair, fragment: &Fragment) -> Self {
        Self {
            file1_id: pair.left_file.id,
            file1_path: pair.left_file.relative_path.to_string_lossy(),
            file1_start_point: point(&fragment.left_region.start_point),
            file1_end_point: point(&fragment.left_region.end_point),
            file2_id: pair.right_file.id,
            file2_path: pair.right_file.relative_path.to_string_lossy(),
            file2_start_point: point(&fragment.right_region.start_point),
            file2_end_point: point(&fragment.right_region.end_point),
            fingerprint_count: fragment.fingerprint_count,
        }
    }
}

fn point(point: &Point) -> String {
    format!("{}:{}", point.row, point.column)
}
