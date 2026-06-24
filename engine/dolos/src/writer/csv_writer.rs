use crate::file::File as SourceFile;
use crate::metadata::Metadata;
use crate::report::Pair;
use crate::writer::output::OutputWriter;
use std::fs::File;
use std::io::{Error, Result};
use std::path::PathBuf;
use std::rc::Rc;

const METADATA_HEADER: &[&str] = &["property", "value"];
const FILES_HEADER: &[&str] = &["id", "path", "content"];
const FRAGMENTS_HEADER: &[&str] = &[
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
const PAIRS_HEADER: &[&str] = &[
    "file1_id",
    "file1_path",
    "file2_id",
    "file2_path",
    "similarity",
    "longest",
    "totalLeft",
    "totalRight",
    "overlapLeft",
    "overlapRight",
];

/// CSV writer that outputs similarity results to a CSV file.
pub struct CsvWriter {
    similarities_writer: csv::Writer<File>,
    /// Present only when `include_fragments` is set; streams rows into `fragments.csv`.
    fragments_writer: Option<csv::Writer<File>>,
}

impl CsvWriter {
    /// Create a new CSV writer.
    ///
    /// Creates `{output_destination}/dolos-report-{time}-{reportName}/` along
    /// with all required parent directories, writes `metadata.csv` and
    /// `files.csv` in one shot each, and opens a streamed `pairs.csv` (and
    /// optionally `fragments.csv` when `metadata.include_fragments` is set) for
    /// the pair rows.
    pub(super) fn new(
        output_destination: PathBuf,
        metadata: &Metadata,
        files: &[Rc<SourceFile>],
    ) -> Result<Self> {
        let report_dir = output_destination.join(report_dir_name(metadata));
        std::fs::create_dir_all(&report_dir)?;

        // metadata.csv — fully known up front, written in one shot.
        let mut meta =
            csv::Writer::from_path(report_dir.join("metadata.csv")).map_err(Error::other)?;
        write_metadata(&mut meta, metadata)?;
        meta.flush().map_err(Error::other)?;

        // files.csv — fully known up front, written in one shot.
        let mut files_writer =
            csv::Writer::from_path(report_dir.join("files.csv")).map_err(Error::other)?;
        write_files(&mut files_writer, files)?;
        files_writer.flush().map_err(Error::other)?;

        // fragments.csv — streamed per pair via write_pair; omitted when fragments are not stored.
        let fragments_writer = if metadata.include_fragments {
            let mut w =
                csv::Writer::from_path(report_dir.join("fragments.csv")).map_err(Error::other)?;
            w.write_record(FRAGMENTS_HEADER).map_err(Error::other)?;
            Some(w)
        } else {
            None
        };

        // pairs.csv — streamed per pair via write_pair.
        let mut similarities_writer =
            csv::Writer::from_path(report_dir.join("pairs.csv")).map_err(Error::other)?;
        similarities_writer
            .write_record(PAIRS_HEADER)
            .map_err(Error::other)?;

        Ok(Self { similarities_writer, fragments_writer })
    }
}

impl OutputWriter for CsvWriter {
    fn write_pair(&mut self, pair: &Pair) -> Result<()> {
        let m = &pair.metrics;
        self.similarities_writer
            .serialize((
                pair.left_file.id.to_string(),
                pair.left_file.relative_path.display().to_string(),
                pair.right_file.id.to_string(),
                pair.right_file.relative_path.display().to_string(),
                m.similarity,
                m.longest_fragment,
                m.total_left,
                m.total_right,
                m.overlap_left,
                m.overlap_right,
            ))
            .map_err(Error::other)?;

        if let Some(writer) = self.fragments_writer.as_mut() {
            for fragment in pair.fragments.as_ref().unwrap() {
                let left_start = &fragment.left_region.start_point;
                let left_end = &fragment.left_region.end_point;
                let right_start = &fragment.right_region.start_point;
                let right_end = &fragment.right_region.end_point;
                writer
                    .write_record([
                        pair.left_file.id.to_string(),
                        pair.left_file.relative_path.display().to_string(),
                        format!("{}:{}", left_start.row, left_start.column),
                        format!("{}:{}", left_end.row, left_end.column),
                        pair.right_file.id.to_string(),
                        pair.right_file.relative_path.display().to_string(),
                        format!("{}:{}", right_start.row, right_start.column),
                        format!("{}:{}", right_end.row, right_end.column),
                        fragment.fingerprint_count.to_string(),
                    ])
                    .map_err(Error::other)?;
            }
        }
        Ok(())
    }

    fn finish(mut self) -> Result<()> {
        self.similarities_writer.flush().map_err(Error::other)?;
        if let Some(mut w) = self.fragments_writer {
            w.flush().map_err(Error::other)?;
        }
        Ok(())
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
    writer.write_record(METADATA_HEADER).map_err(Error::other)?;
    for (property, value) in &metadata.properties() {
        writer
            .write_record([*property, value])
            .map_err(Error::other)?;
    }
    Ok(())
}

fn write_files(
    writer: &mut csv::Writer<impl std::io::Write>,
    files: &[Rc<SourceFile>],
) -> Result<()> {
    writer.write_record(FILES_HEADER).map_err(Error::other)?;
    for file in files {
        writer
            .write_record([
                file.id.to_string(),
                file.relative_path.display().to_string(),
                file.content.clone(),
            ])
            .map_err(Error::other)?;
    }
    Ok(())
}
