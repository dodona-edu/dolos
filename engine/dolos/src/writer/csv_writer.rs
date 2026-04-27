use crate::report::Pair;
use crate::writer::output::OutputWriter;
use std::fs::File;
use std::io;
use std::io::{BufWriter, Write};
use std::path::PathBuf;

/// CSV writer that outputs similarity results to a `pairs.csv` file inside a
/// named report directory.
pub struct CsvWriter {
    writer: BufWriter<File>,
}

impl CsvWriter {
    /// Create a new CSV writer.
    ///
    /// Creates `{output_destination}/{name}/pairs.csv`, along with all required
    /// parent directories.
    pub(super) fn new(output_destination: PathBuf, name: &str) -> io::Result<Self> {
        let report_dir = output_destination.join(name);
        std::fs::create_dir_all(&report_dir)?;
        let csv_path = report_dir.join("pairs.csv");
        let mut writer = BufWriter::new(File::create(csv_path)?);
        writeln!(
            writer,
            "file1,file2,similarity,longest,totalLeft,totalRight,overlapLeft,overlapRight"
        )?;
        Ok(Self { writer })
    }
}

impl OutputWriter for CsvWriter {
    fn write_pair(&mut self, pair: &Pair) -> io::Result<()> {
        writeln!(
            self.writer,
            "{},{},{},{},{},{},{},{}",
            pair.left_file.file_name(),
            pair.right_file.file_name(),
            pair.metrics.similarity,
            pair.metrics.longest_fragment,
            pair.metrics.total_left,
            pair.metrics.total_right,
            pair.metrics.overlap_left,
            pair.metrics.overlap_right,
        )
    }

    fn finish(mut self) -> io::Result<()> {
        self.writer.flush()
    }
}
