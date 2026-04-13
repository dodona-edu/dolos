use clap::Parser;
use dolos::dolos::{Dolos, DolosConfig};
use dolos::opts::{Command, Opts};
use dolos::writer::{OutputWriter, Writer};
use std::fs;
use std::path::PathBuf;

///
/// Main function
fn main() -> std::io::Result<()> {
    let opts = Opts::parse();

    match opts.command {
        Command::Run {
            files,
            output_format,
            output_destination,
        } => {
            let paths = get_file_paths(files)?;
            let dolos = Dolos::from_paths(paths, DolosConfig::default());
            let report = dolos.build_report();

            Writer::new(output_format, output_destination)?.write_and_finish(&report)?;
        }
    }
    Ok(())
}

fn get_file_paths(files: Vec<PathBuf>) -> std::io::Result<Vec<PathBuf>> {
    if files.len() == 1 {
        let path = &files[0];
        if path.is_dir() {
            // Read all files from the directory
            fs::read_dir(path)?
                .map(|entry| entry.map(|e| e.path()))
                .collect()
        } else if path.extension().and_then(|s| s.to_str()) == Some("zip") {
            // TODO: Handle zip file extraction
            // For now, return error
            Err(std::io::Error::new(
                std::io::ErrorKind::Unsupported,
                "ZIP file handling not yet implemented",
            ))
        } else {
            // Single file
            Err(std::io::Error::new(
                std::io::ErrorKind::InvalidInput,
                "Expected a zip archive, directory or multiple files, got a single file",
            ))
        }
    } else {
        // Multiple files provided directly
        Ok(files)
    }
}
