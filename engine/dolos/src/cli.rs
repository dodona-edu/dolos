use crate::Dolos;
use crate::opts::{Command, Opts};
use crate::writer::{OutputWriter, Writer};
use clap::Parser;
use std::io::Result;

/// Parse command-line arguments and run the Dolos CLI.
///
/// This is the entry point used by the `dolos` binary: it parses the process
/// arguments, builds the analysis report, and writes it in the requested
/// output format.
pub fn run() -> Result<()> {
    let opts = Opts::parse();

    match opts.command {
        Command::Run { files, dolos_args, output_args } => {
            let report = Dolos::new(files, dolos_args.try_into()?)?.build_report();
            Writer::new(output_args, &report)?.write_and_finish(&report)?;
        }
    }
    Ok(())
}
