use std::io::Read;
use std::path::PathBuf;

use tree_sitter::Tree;

use crate::language::Language;

#[derive(Debug)]
pub struct File {
    pub path: PathBuf,
    pub language: Language,
    pub tree: Tree,
}

impl File {
    pub fn read(path: &PathBuf) -> std::io::Result<String> {
        let mut content = String::new();
        std::fs::File::open(path)?.read_to_string(&mut content)?;
        Ok(content)
    }
}
