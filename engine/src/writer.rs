use std::fs::File;
use std::io;
use std::io::{BufWriter, Write};
use std::path::PathBuf;
use crate::opts::OutputFormat;
use crate::winnowing::report::Report;

/// Trait for writing similarity analysis results in different formats
pub trait OutputWriter {
    /// Write a single pair to the output
    fn write_pair(&mut self, left_file: usize, right_file: usize, report: &Report) -> io::Result<()>;

    /// Write all pairs to the output
    fn write_report(&mut self, report: &Report) -> io::Result<()> {

        for left_file in 0..report.files.len() {
            for right_file in  left_file+1..report.files.len() {
                self.write_pair(left_file, right_file, report)?;
            }
        }

        Ok(())
    }

    /// Finalize and flush the output. Consumes the writer.
    fn finish(self) -> io::Result<()>;

    /// Convenience method to write pairs and finish in one call
    fn write_and_finish(mut self, report: &Report) -> io::Result<()>
    where
        Self: Sized,
    {
        self.write_report(report)?;
        self.finish()
    }
}

/// Enum wrapping different output writer implementations
pub enum Writer {
    Csv(CsvWriter),
    Terminal(TerminalWriter),
}

impl Writer {
    /// Create a new writer based on the specified format
    pub fn new(format: OutputFormat, output_destination: PathBuf) -> io::Result<Self> {
        match format {
            OutputFormat::Csv => Ok(Writer::Csv(CsvWriter::new(output_destination)?)),
            OutputFormat::Terminal | OutputFormat::Console => Ok(Writer::Terminal(TerminalWriter)),
        }
    }
}

impl OutputWriter for Writer {
    fn write_pair(&mut self, left_file: usize, right_file: usize, report: &Report) -> io::Result<()> {
        match self {
            Writer::Csv(writer) => writer.write_pair(left_file, right_file, report),
            Writer::Terminal(writer) => writer.write_pair(left_file, right_file, report),
        }
    }

    fn finish(self) -> io::Result<()> {
        match self {
            Writer::Csv(writer) => writer.finish(),
            Writer::Terminal(writer) => writer.finish(),
        }
    }
}

/// CSV writer that outputs similarity results to a CSV file
pub struct CsvWriter {
    writer: BufWriter<File>,
}

impl CsvWriter {
    /// Create a new CSV writer that writes to "similarities.csv" in the specified directory
    fn new(output_destination: PathBuf) -> io::Result<Self> {
        std::fs::create_dir_all(&output_destination)?;
        let csv_path = output_destination.join("similarities.csv");
        let mut writer = BufWriter::new(File::create(csv_path)?);
        writeln!(writer, "file1,file2,similarity,longest")?;
        Ok(Self { writer })
    }
}

impl OutputWriter for CsvWriter {
    fn write_pair(&mut self, left_file: usize, right_file: usize, report: &Report) -> io::Result<()> {
        writeln!(
            self.writer,
            "{},{},{},{}",
            report.files[left_file].file_name(),
            report.files[right_file].file_name(),
            report.analysis_result.similarities.get(left_file, right_file),
            report.analysis_result.longest_fragments.get(left_file, right_file)
        )
    }

    fn finish(mut self) -> io::Result<()> {
        self.writer.flush()
    }
}

/// Terminal writer that outputs similarity results to stdout
pub struct TerminalWriter;

impl OutputWriter for TerminalWriter {
    fn write_pair(&mut self, left_file: usize, right_file: usize, report: &Report) -> io::Result<()> {
        println!(
            "{} - {} (sim: {:.2}%, longest: {})",
            report.files[left_file].file_name(),
            report.files[right_file].file_name(),
            report.analysis_result.similarities.get(left_file, right_file) * 100.0,
            report.analysis_result.longest_fragments.get(left_file, right_file)
        );
        Ok(())
    }

    fn finish(self) -> io::Result<()> {
        Ok(())
    }
}