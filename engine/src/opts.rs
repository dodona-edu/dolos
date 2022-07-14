use clap::{Parser, Subcommand};

use crate::file::File;

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
        /// Files to analyse
        files: Vec<File>
    },
}

