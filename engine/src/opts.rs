use clap::{Parser, Subcommand};

use std::path::PathBuf;

#[derive(Parser, Debug)]
#[clap(author, version, about, long_about = None)]
pub struct Opts {
    #[clap(subcommand)]
    pub command: Command,
}

#[derive(Debug, Clone, clap::ValueEnum)]
pub enum OutputFormat {
    Csv,
    Terminal,
    Console,
}

#[derive(Subcommand, Debug)]
pub enum Command {
    /// Run a similarity analysis on the given files.
    Run {
        /// Files to analyze
        #[arg(required = true)]
        files: Vec<PathBuf>,

        #[arg(value_enum, short = 'f', long, default_value_t = OutputFormat::Terminal)]
        output_format: OutputFormat,

        #[arg(short, long, default_value = ".")]
        output_destination: PathBuf
    },
}
