use std::path::PathBuf;
use std::io::Read;
use std::str::FromStr;
use std::convert::Infallible;

use tree_sitter::Tree;

use crate::language::Language;

#[derive(Debug)]
pub struct File {
    pub path: PathBuf,
    pub lang: Option<Language>,
    pub tree: Option<Tree>,
}

impl File {
    pub fn new(path: PathBuf) -> File {
        let lang = path.extension().and_then(Language::from_ext);
        File { path, lang, tree: None }
    }

    pub fn content(&self) -> std::io::Result<String> {
        let mut content = String::new();
        std::fs::File::open(self.path.clone())?
            .read_to_string(&mut content)?;
        Ok(content)
    }
}

impl FromStr for File where File: Sized {
    type Err = Infallible;

    fn from_str(input: &str) -> Result<Self, Self::Err> {
        Ok(File::new(PathBuf::from_str(input)?))
    }
}
