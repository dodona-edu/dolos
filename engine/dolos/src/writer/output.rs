use crate::opts::OutputFormat;
use crate::report::{Pair, Report};
use crate::writer::csv_writer::CsvWriter;
use crate::writer::terminal_writer::TerminalWriter;
use std::io::Result;
use std::path::PathBuf;

/// Trait for writing similarity analysis results in different formats.
pub trait OutputWriter {
    /// Write a single pair to the output.
    fn write_pair(&mut self, pair: &Pair) -> Result<()>;

    /// Write all pairs to the output.
    fn write_report(&mut self, report: &Report) -> Result<()> {
        for pair in report.iter_pairs() {
            self.write_pair(&pair)?;
        }
        Ok(())
    }

    /// Finalize and flush the output. Consumes the writer.
    fn finish(self) -> Result<()>;

    /// Convenience method to write pairs and finish in one call.
    fn write_and_finish(mut self, report: &Report) -> Result<()>
    where
        Self: Sized,
    {
        self.write_report(report)?;
        self.finish()
    }
}

/// Enum wrapping different output writer implementations.
pub enum Writer {
    Csv(Box<CsvWriter>),
    Terminal(TerminalWriter),
}

impl Writer {
    /// Create a new writer based on the specified format.
    pub fn new(format: OutputFormat, output_destination: PathBuf) -> Result<Self> {
        match format {
            OutputFormat::Csv => Ok(Writer::Csv(Box::new(CsvWriter::new(output_destination)?))),
            OutputFormat::Terminal => Ok(Writer::Terminal(TerminalWriter)),
        }
    }
}

impl OutputWriter for Writer {
    fn write_pair(&mut self, pair: &Pair) -> Result<()> {
        match self {
            Writer::Csv(w) => w.write_pair(pair),
            Writer::Terminal(w) => w.write_pair(pair),
        }
    }

    fn finish(self) -> Result<()> {
        match self {
            Writer::Csv(w) => w.finish(),
            Writer::Terminal(w) => w.finish(),
        }
    }
}
