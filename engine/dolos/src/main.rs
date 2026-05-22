use clap::Parser;
use dolos::dolos::{Dolos, DolosConfig};
use dolos::opts::{Command, Opts};
use dolos::reader::Dataset;
use dolos::writer::{OutputWriter, Writer};
use std::io::Result;

///
/// Main function
fn main() -> Result<()> {
    let opts = Opts::parse();

    match opts.command {
        Command::Run { files, output_format, output_destination } => {
            let dataset = Dataset::create(files)?;
            let dolos = Dolos::from_paths(dataset.files, DolosConfig::default());
            let report = dolos.build_report();

            Writer::new(output_format, output_destination)?.write_and_finish(&report)?;
        }
    }
    Ok(())
}
