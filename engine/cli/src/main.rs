use crate::opts::{Command, Opts};
use clap::Parser;
use dolos::Dolos;
use std::process::ExitCode;

mod opts;
mod views;

fn main() -> ExitCode {
    let opts = Opts::parse();

    match run(opts) {
        Ok(()) => ExitCode::SUCCESS,
        Err(e) => {
            eprintln!("error: {e:#}");
            ExitCode::FAILURE
        }
    }
}

/// Run the command that `opts` selects.
fn run(opts: Opts) -> anyhow::Result<()> {
    match opts.command {
        Command::Run { files, dolos_args, output_args } => {
            let report = Dolos::new(files, dolos_args.try_into()?)?.build_report();
            views::show(output_args, &report)?;
        }
    }
    Ok(())
}
