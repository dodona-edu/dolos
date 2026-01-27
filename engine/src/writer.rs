use std::fs::File;
use std::io;
use std::io::{BufWriter, Write};
use crate::opts::OutputFormat;

pub trait OutputWriter {
    fn new() -> io::Result<Self> where Self: Sized;
    fn write_pair(&mut self, right_file: &str, left_file: &str, similarity: f64, longest: usize) -> io::Result<()>;
    fn finish(self) -> io::Result<()>;
}

pub enum Writer {
    Csv(CsvWriter),
    Terminal(TerminalWriter),
}

impl Writer {
    pub fn new(format: OutputFormat) -> io::Result<Self> {
        match format {
            OutputFormat::Csv => Ok(Writer::Csv(CsvWriter::new()?)),
            OutputFormat::Terminal => Ok(Writer::Terminal(TerminalWriter::new()?)),
        }
    }
}

impl OutputWriter for Writer {
    fn new() -> io::Result<Self> {
        // This won't be used directly, but needed for trait completeness
        unreachable!("Use Writer::new(format) instead")
    }

    fn write_pair(&mut self, right_file: &str, left_file: &str, similarity: f64, longest: usize) -> io::Result<()> {
        match self {
            Writer::Csv(writer) => writer.write_pair(right_file, left_file, similarity, longest),
            Writer::Terminal(writer) => writer.write_pair(right_file, left_file, similarity, longest),
        }
    }

    fn finish(self) -> io::Result<()> {
        match self {
            Writer::Csv(writer) => writer.finish(),
            Writer::Terminal(writer) => writer.finish(),
        }
    }
}

pub struct CsvWriter {
    writer: BufWriter<File>,
}

impl OutputWriter for CsvWriter {
    fn new() -> io::Result<Self> {
        Ok(Self {
            writer: BufWriter::new(File::create("similarities.csv")?),
        })
    }

    fn write_pair(&mut self, right_file: &str, left_file: &str, similarity: f64, longest: usize) -> io::Result<()> {
        writeln!(self.writer, "{},{},{},{}", right_file, left_file, similarity, longest)
    }

    fn finish(mut self) -> io::Result<()> {
        self.writer.flush()
    }
}

pub struct TerminalWriter;

impl OutputWriter for TerminalWriter {
    fn new() -> io::Result<Self> {
        Ok(Self)
    }

    fn write_pair(&mut self, right_file: &str, left_file: &str, similarity: f64, longest: usize) -> io::Result<()> {
        println!("{} - {} (sim: {:.2}%, longest: {})",
                 left_file, right_file, similarity * 100.0, longest);
        Ok(())
    }

    fn finish(self) -> io::Result<()> {
        Ok(())
    }
}