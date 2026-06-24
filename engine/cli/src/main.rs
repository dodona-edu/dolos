use crate::opts::{Command, Opts};
use crate::writer::{OutputWriter, Writer};
use clap::Parser;
use dolos::Dolos;
use std::io::Result;

mod opts;
mod writer;

fn main() -> Result<()> {
    let opts = Opts::parse();

    match opts.command {
        Command::Run { files, dolos_args, output_args } => {
            let report = Dolos::new(files, dolos_args.try_into()?)?.build_report();
            Writer::new(output_args, &report)?.write_and_finish(&report)?;
        }
    }
    Ok(())
}
