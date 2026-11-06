use dolos::{File, Fragment, Pair, Point, Region};
use serde::Serialize;
use std::borrow::Cow;
use std::ops::Range;

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
///
/// The last three are empty unless `--include-analysis-data` was given:
/// - `fingerprints`: one hash per fingerprint, `[hash,...]`.
/// - `fingerprint_regions`: `[start_row,start_col,end_row,end_col]` per fingerprint.
/// - `ignored_intervals`: one half-open `[start,end)` interval per ignored run.
#[derive(Serialize)]
pub struct FileRow<'a> {
    id: usize,
    path: Cow<'a, str>,
    content: &'a str,
    fingerprints: Option<String>,
    fingerprint_regions: Option<String>,
    ignored_intervals: Option<String>,
}

impl<'a> FileRow<'a> {
    pub const HEADER: [&'static str; 6] = [
        "id",
        "path",
        "content",
        "fingerprints",
        "fingerprint_regions",
        "ignored_intervals",
    ];

    pub fn new(file: &'a File) -> Self {
        let data = file.analysis_data.as_ref();
        Self {
            id: file.id,
            path: file.relative_path.to_string_lossy(),
            content: &file.content,
            fingerprints: data.map(|d| bracketed(&d.fingerprints, usize::to_string)),
            fingerprint_regions: data.map(|d| bracketed(&d.regions, region_to_string)),
            ignored_intervals: data.map(|d| bracketed(&d.ignored, range_to_string)),
        }
    }
}

/// One row of `pairs.csv`.
///
/// - `id`: the index of the pair in the order (0,1), (0,2), ..., (1,2), ... of its file ids.
///   It does not depend on `--sort-by`.
/// - `leftFileId`, `rightFileId`: the ids of the two files in `files.csv`.
/// - `similarity`: `totalOverlap` divided by `totalLeft + totalRight`, between 0 and 1.
/// - `longestFragment`: the length of the longest match, in fingerprints.
/// - `overlapLeft`, `overlapRight`: the fingerprints of each file that a match covers.
/// - `totalLeft`, `totalRight`: the fingerprints of each file that are not ignored.
/// - `totalOverlap`: `overlapLeft + overlapRight`.
#[derive(Serialize)]
pub struct PairRow {
    id: usize,
    left_file_id: usize,
    right_file_id: usize,
    similarity: f64,
    longest_fragment: usize,
    overlap_left: usize,
    overlap_right: usize,
    total_left: usize,
    total_right: usize,
    total_overlap: usize,
}

impl PairRow {
    pub const HEADER: [&'static str; 10] = [
        "id",
        "leftFileId",
        "rightFileId",
        "similarity",
        "longestFragment",
        "overlapLeft",
        "overlapRight",
        "totalLeft",
        "totalRight",
        "totalOverlap",
    ];

    pub fn new(id: usize, pair: &Pair) -> Self {
        let metrics = &pair.metrics;
        Self {
            id,
            left_file_id: pair.left_file.id,
            right_file_id: pair.right_file.id,
            similarity: metrics.similarity,
            longest_fragment: metrics.longest_match,
            overlap_left: metrics.overlap_left,
            overlap_right: metrics.overlap_right,
            total_left: metrics.total_left,
            total_right: metrics.total_right,
            total_overlap: metrics.overlap_left + metrics.overlap_right,
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

fn bracketed<T>(items: &[T], fmt: impl Fn(&T) -> String) -> String {
    format!("[{}]", items.iter().map(fmt).collect::<Vec<_>>().join(","))
}

fn range_to_string(range: &Range<usize>) -> String {
    format!("[{},{}]", range.start, range.end)
}

fn region_to_string(region: &Region) -> String {
    format!(
        "[{},{},{},{}]",
        region.start_point.row,
        region.start_point.column,
        region.end_point.row,
        region.end_point.column,
    )
}
