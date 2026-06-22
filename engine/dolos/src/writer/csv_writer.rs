use crate::metadata::Metadata;
use crate::report::Pair;
use crate::writer::output::OutputWriter;
use std::fs::File;
use std::io::{Error, Result};
use std::path::PathBuf;

const METADATA_HEADER: &[&str] = &["property", "value"];

const PAIRS_HEADER: &[&str] = &[
    "file1",
    "file2",
    "similarity",
    "longest",
    "totalLeft",
    "totalRight",
    "overlapLeft",
    "overlapRight",
];

/// CSV writer that outputs similarity results to a CSV file.
pub struct CsvWriter {
    writer: csv::Writer<File>,
}

impl CsvWriter {
    /// Create a new CSV writer.
    ///
    /// Creates `{output_destination}/dolos-report-{time}-{reportName}/` along
    /// with all required parent directories, writes `metadata.csv` in one shot,
    /// and opens a streamed `pairs.csv` for the pair rows.
    pub(super) fn new(output_destination: PathBuf, metadata: &Metadata) -> Result<Self> {
        let report_dir = output_destination.join(report_dir_name(metadata));
        std::fs::create_dir_all(&report_dir)?;

        // metadata.csv — fully known up front, written in one shot.
        let mut meta =
            csv::Writer::from_path(report_dir.join("metadata.csv")).map_err(Error::other)?;
        write_metadata(&mut meta, metadata)?;
        meta.flush().map_err(Error::other)?;

        // pairs.csv — streamed per pair via write_pair.
        let mut writer =
            csv::Writer::from_path(report_dir.join("pairs.csv")).map_err(Error::other)?;
        writer.write_record(PAIRS_HEADER).map_err(Error::other)?;
        Ok(Self { writer })
    }
}

impl OutputWriter for CsvWriter {
    fn write_pair(&mut self, pair: &Pair) -> Result<()> {
        let m = &pair.metrics;
        self.writer
            .serialize((
                pair.left_file.relative_path.display().to_string(),
                pair.right_file.relative_path.display().to_string(),
                m.similarity,
                m.longest_fragment,
                m.total_left,
                m.total_right,
                m.overlap_left,
                m.overlap_right,
            ))
            .map_err(Error::other)
    }

    fn finish(mut self) -> Result<()> {
        self.writer.flush().map_err(Error::other)
    }
}

fn report_dir_name(metadata: &Metadata) -> String {
    format!(
        "dolos-report-{}-{}",
        metadata.created_at.format("%Y%m%dT%H%M%S%3fZ"),
        metadata.report_name,
    )
}

fn write_metadata(
    writer: &mut csv::Writer<impl std::io::Write>,
    metadata: &Metadata,
) -> Result<()> {
    #[rustfmt::skip]
    let rows: [(&str, String); 13] = [
        ("reportName", metadata.report_name.clone()),
        ("createdAt", metadata.created_at.to_rfc3339()),
        ("language", format!("{:?}", metadata.language)),
        ("languageDetected", metadata.language_detected.to_string()),
        ("kgramLength", metadata.kgram_length.to_string()),
        ("kgramsInWindow", metadata.kgrams_in_window.to_string()),
        ("minLengthMatch", metadata.min_length_match.to_string()),
        ("includeComments", metadata.include_comments.to_string()),
        ("includeFragments", metadata.include_fragments.to_string()),
        ("maxFingerprintFileCount", optional(metadata.max_fingerprint_file_count.map(|v| v.to_string()))),
        ("sortBy", optional(metadata.sort_by.map(|s| format!("{s:?}")))),
        ("fragmentSortBy", optional(metadata.fragment_sort_by.map(|s| format!("{s:?}")))),
        ("ignore", optional(metadata.ignore.as_ref().map(|p| p.display().to_string()))),
    ];

    writer.write_record(METADATA_HEADER).map_err(Error::other)?;
    for (property, value) in &rows {
        writer
            .write_record([*property, value])
            .map_err(Error::other)?;
    }
    Ok(())
}

/// Unwrap an optional metadata field, returning an empty string when absent.
fn optional(value: Option<String>) -> String {
    value.unwrap_or("null".into())
}
