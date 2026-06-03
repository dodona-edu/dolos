use clap::Parser;
use dolos::dolos::Dolos;
use dolos::opts::{Command, Opts, Resolve};
use dolos::reader::Dataset;
use dolos::writer::{OutputWriter, Writer};
use std::io::Result;

///
/// Main function
fn main() -> Result<()> {
    let opts = Opts::parse();

    match opts.command {
        Command::Run { files, run_args } => {
            let dataset = Dataset::create(files)?;
            let resolved = run_args.resolve(&dataset);

            let dolos = Dolos::from_file_set(dataset.file_set, resolved.index_config);
            let report = dolos.build_report(resolved.report_config);

            Writer::new(resolved.output_config)?.write_and_finish(&report)?;
        }
    }
    Ok(())
}
