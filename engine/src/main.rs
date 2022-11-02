

use clap::Parser;
use dolos::opts::{Opts, Command};
use dolos::dolos::Dolos;

///
/// Main function
/// ```
/// assert_eq!(true, false)
/// ```
fn main() {
    let opts = Opts::parse();

    match opts.command {
        Command::Run{ files } => {
            let dolos = Dolos::from_files(files);
            dbg!(dolos);
        }
    }

}
