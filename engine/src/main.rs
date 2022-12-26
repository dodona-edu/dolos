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
            dbg!(dolos);
        }
    }
}
