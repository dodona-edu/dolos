use crate::opts::{Command, Opts};
use clap::Parser;
use dolos::Dolos;
use std::io::Result;

mod opts;
mod views;

fn main() -> Result<()> {
    let opts = Opts::parse();

    match opts.command {
        Command::Run { files, dolos_args, output_args } => {
            let report = Dolos::new(files, dolos_args.try_into()?)?.build_report();
            views::show(output_args, &report)?;
        }
    }
    Ok(())
}
