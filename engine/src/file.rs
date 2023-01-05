use std::fmt;
use std::hash::{Hash, Hasher};
use std::io::Read;
use std::path::{Path, PathBuf};

use tree_sitter::Tree;

use crate::language::Language;
use crate::tokenizer::Token;

pub struct File {
    pub path: PathBuf,
    pub language: Language,
    pub tree: Tree,
    pub tokens: Vec<Token>,
}

impl File {
    pub fn read<P: AsRef<Path>>(path: P) -> std::io::Result<String> {
        let mut content = String::new();
        std::fs::File::open(path)?.read_to_string(&mut content)?;
        Ok(content)
    }
}

impl Hash for File {
    fn hash<H>(&self, state: &mut H)
    where
        H: Hasher,
    {
        self.path.hash(state);
    }
}

impl PartialEq for File {
    fn eq(&self, other: &Self) -> bool {
        self.path == other.path
    }
}

impl Eq for File {}

impl PartialOrd for File {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        self.path.partial_cmp(&other.path)
    }
}

impl fmt::Debug for File {
    fn fmt(&self, fmt: &mut fmt::Formatter) -> fmt::Result {
        fmt.debug_struct("File").field("path", &self.path).finish()
    }
}
