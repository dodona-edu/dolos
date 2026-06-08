use crate::opts::{OutputConfig, OutputFormat};
use crate::report::{Pair, Report};
use crate::writer::csv_writer::CsvWriter;
use crate::writer::terminal_writer::TerminalWriter;
use std::io;
use std::io::Result;

/// Trait for writing similarity analysis results in different formats.
pub trait OutputWriter {
    /// Write a single pair to the output.
    fn write_pair(&mut self, pair: &Pair) -> Result<()>;

    /// Write all pairs to the output.
    fn write_report(&mut self, report: &Report) -> Result<()> {
        for pair in &report.pairs {
            self.write_pair(pair)?;
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
    /// Create a new writer based on the specified output arguments.
    pub fn new(args: OutputConfig, report: &Report) -> io::Result<Self> {
        match args.output_format {
            OutputFormat::Csv => Ok(Writer::Csv(Box::new(CsvWriter::new(
                args.output_destination,
                &report.name,
            )?))),
            OutputFormat::Terminal | OutputFormat::Console => Ok(Writer::Terminal(TerminalWriter)),
            OutputFormat::Html | OutputFormat::Web => todo!("HTML output not yet implemented"),
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
