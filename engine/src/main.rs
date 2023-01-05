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
                    "{} - {} similarity {:.2}%",
                    pair.pair.left.path.display(),
                    pair.pair.right.path.display(),
                    pair.similarity * 100f64
                )
            }
        }
    }
}
