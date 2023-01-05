use clap::Parser;
use dolos::dolos::Dolos;
use dolos::opts::{Command, Opts};

///
/// Main function
/// ```
/// assert_eq!(true, false)
/// ```
fn main() {
    let opts = Opts::parse();

    match opts.command {
        Command::Run { files } => {
            let dolos = Dolos::from_paths(files);
            let report = dolos.build_report();
            for pair in report.pairs {
                println!(
                    "{} - {} (sim: {:.2}%, longest: {}, total: {})",
                    pair.pair.left.file_name(),
                    pair.pair.right.file_name(),
                    pair.similarity * 100f64,
                    pair.longest,
                    pair.overlap
                )
            }
        }
    }
}
