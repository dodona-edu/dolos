
extern crate tree_sitter;
extern crate tree_sitter_java;
extern crate clap;

mod dolos;
mod file;
mod language;
mod opts;

use crate::clap::Parser;
use opts::{Opts, Command};
use dolos::Dolos;

fn main() {
    let opts = Opts::parse();
    let mut dolos = Dolos::new();

    match opts.command {
        Command::Run{ files } => {
            dolos.add_files(files);
            dbg!(dolos);
        }
    }

}
