use clap::{Parser, Subcommand};

use std::path::PathBuf;

#[derive(Parser, Debug)]
#[clap(author, version, about, long_about = None)]
pub struct Opts {
    #[clap(subcommand)]
    pub command: Command,
}

#[derive(Subcommand, Debug)]
pub enum Command {
    /// Run a similarity analysis on the given files.
    Run {
        /// Files to analyze
        files: Vec<PathBuf>,
    },
}
