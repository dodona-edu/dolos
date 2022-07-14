
extern crate tree_sitter;
extern crate tree_sitter_java;
extern crate clap;
extern crate core;

mod dolos;
mod file;
mod language;
mod opts;

use crate::clap::Parser;
use opts::{Opts, Command};
use dolos::Dolos;

fn main() {
    let opts = Opts::parse();

    match opts.command {
        Command::Run{ files } => { 
            let dolos = Dolos::from_files(files);
            dbg!(dolos);
        }
    }

}
