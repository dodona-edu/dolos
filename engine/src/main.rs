use std::fs;
use clap::Parser;
use dolos::dolos::Dolos;
use dolos::opts::{Command, Opts};
use dolos::writer::{OutputWriter, Writer};

///
/// Main function
/// ```
/// assert_eq!(true, false)
/// ```
fn main() -> std::io::Result<()> {
    let opts = Opts::parse();

    match opts.command {
        Command::Run { files, output_format, output_destination } => {
            let paths = fs::read_dir(files).unwrap().map(|entry| entry.unwrap().path()).collect::<Vec<_>>();
            let dolos = Dolos::from_paths(paths);
            let report = dolos.build_report();

            let mut writer = Writer::new(output_format, output_destination)?;

            for pair in &report.pairs {
                writer.write_pair(
                    pair.right_file.file_name(),
                    pair.left_file.file_name(),
                    pair.similarity,
                    pair.longest,
                )?;
            }

            writer.finish()?;
        }
    }
    Ok(())
}

