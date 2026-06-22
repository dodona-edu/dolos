use clap::Parser;
use dolos::dolos::Dolos;
use dolos::opts::{Command, Opts};
use dolos::writer::{OutputWriter, Writer};
use std::io::Result;

fn main() -> Result<()> {
    let opts = Opts::parse();

    match opts.command {
        Command::Run { files, dolos_args: config, output_args } => {
            let report = Dolos::new(files, config.try_into()?)?.build_report();
            Writer::new(output_args, &report)?.write_and_finish(&report)?;
        }
    }
    Ok(())
}
