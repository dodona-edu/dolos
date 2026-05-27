use crate::report::Pair;
use crate::writer::output::OutputWriter;
use std::fs::File;
use std::io::{Error, Result};
use std::path::PathBuf;

const HEADER: &[&str] = &[
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
    /// Create a new CSV writer that writes to "similarities.csv" in the specified directory.
    pub(super) fn new(output_destination: PathBuf) -> Result<Self> {
        std::fs::create_dir_all(&output_destination)?;
        let csv_path = output_destination.join("similarities.csv");
        let mut writer = csv::Writer::from_path(&csv_path).map_err(Error::other)?;
        writer.write_record(HEADER).map_err(Error::other)?;
        Ok(Self { writer })
    }
}

impl OutputWriter for CsvWriter {
    fn write_pair(&mut self, pair: &Pair) -> Result<()> {
        let m = pair.metrics;
        self.writer
            .serialize((
                pair.left_file.path.display().to_string(),
                pair.right_file.path.display().to_string(),
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
