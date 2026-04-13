use crate::report::Pair;
use crate::writer::output::OutputWriter;
use std::fs::File;
use std::io;
use std::io::{BufWriter, Write};
use std::path::PathBuf;

/// CSV writer that outputs similarity results to a CSV file.
pub struct CsvWriter {
    writer: BufWriter<File>,
}

impl CsvWriter {
    /// Create a new CSV writer that writes to "similarities.csv" in the specified directory.
    pub(super) fn new(output_destination: PathBuf) -> io::Result<Self> {
        std::fs::create_dir_all(&output_destination)?;
        let csv_path = output_destination.join("similarities.csv");
        let mut writer = BufWriter::new(File::create(csv_path)?);
        writeln!(writer, "file1,file2,similarity,longest")?;
        Ok(Self { writer })
    }
}

impl OutputWriter for CsvWriter {
    fn write_pair(&mut self, pair: &Pair) -> io::Result<()> {
        writeln!(
            self.writer,
            "{},{},{},{}",
            pair.left_file.file_name(),
            pair.right_file.file_name(),
            pair.similarity,
            pair.longest_fragment
        )
    }

    fn finish(mut self) -> io::Result<()> {
        self.writer.flush()
    }
}
