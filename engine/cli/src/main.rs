use crate::opts::{Command, Opts};
use clap::Parser;
use dolos::Dolos;
use std::process::ExitCode;

mod logging;
mod opts;
mod views;

fn main() -> ExitCode {
    let opts = Opts::parse();
    logging::init(opts.verbosity.tracing_level_filter());

    match run(opts.command) {
        Ok(()) => ExitCode::SUCCESS,
        Err(e) => {
            tracing::error!("{e:#}");
            ExitCode::FAILURE
        }
    }
}

/// Run `command`.
fn run(command: Command) -> anyhow::Result<()> {
    match command {
        Command::Run { files, dolos_args, output_args } => {
            let report = Dolos::new(files, dolos_args.try_into()?)?.build_report();
            views::show(output_args, &report)?;
        }
    }
    Ok(())
}
