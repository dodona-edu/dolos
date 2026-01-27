use std::fs::File;
use std::io;
use std::io::{BufWriter, Write};
use std::path::PathBuf;
use crate::opts::OutputFormat;

pub trait OutputWriter {
    fn write_pair(&mut self, right_file: &str, left_file: &str, similarity: f64, longest: usize) -> io::Result<()>;
    fn finish(self) -> io::Result<()>;
}

pub enum Writer {
    Csv(CsvWriter),
    Terminal(TerminalWriter),
}

impl Writer {
    pub fn new(format: OutputFormat, output_destination: PathBuf) -> io::Result<Self> {
        match format {
            OutputFormat::Csv => Ok(Writer::Csv(CsvWriter::new(output_destination)?)),
            OutputFormat::Terminal => Ok(Writer::Terminal(TerminalWriter)),
        }
    }
}

impl OutputWriter for Writer {

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

impl CsvWriter {
    fn new(output_destination: PathBuf) -> io::Result<Self> {
        let csv_path = output_destination.join("similarities.csv");
        let mut writer = BufWriter::new(File::create(csv_path)?);
        writeln!(writer, "file1,file2,similarity,longest")?;
        Ok(Self {
            writer,
        })
    }
}

impl OutputWriter for CsvWriter {


    fn write_pair(&mut self, right_file: &str, left_file: &str, similarity: f64, longest: usize) -> io::Result<()> {
        writeln!(self.writer, "{},{},{},{}", right_file, left_file, similarity, longest)
    }

    fn finish(mut self) -> io::Result<()> {
        self.writer.flush()
    }
}

pub struct TerminalWriter;

impl OutputWriter for TerminalWriter {

    fn write_pair(&mut self, right_file: &str, left_file: &str, similarity: f64, longest: usize) -> io::Result<()> {
        println!("{} - {} (sim: {:.2}%, longest: {})",
                 left_file, right_file, similarity * 100.0, longest);
        Ok(())
    }

    fn finish(self) -> io::Result<()> {
        Ok(())
    }
}