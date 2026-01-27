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
        Command::Run { files, output_format } => {
            let dolos = Dolos::from_paths(files);
            let report = dolos.build_report();

            let mut writer = Writer::new(output_format)?;

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

