use crate::file::File;
use crate::language::Language;
use crate::winnowing::index::Index;
use std::fmt;
use std::path::PathBuf;
use tree_sitter::Parser;

pub struct Dolos {
    index: Index,
    language: Language,
}

impl Dolos {
    pub fn from_paths(paths: Vec<PathBuf>) -> Self {
        let first = paths.first().expect("no paths given");
        let language = Language::guess_from_path(first).expect("lang");

        let index = Index::new(23, 17, language);
        let mut dolos = Dolos { index, language };
        dolos.index.add_files(paths);
        dolos
    }
}

impl fmt::Debug for Dolos {
    fn fmt(&self, fmt: &mut fmt::Formatter) -> fmt::Result {
        fmt.debug_struct("Dolos")
            .field("files", &self.index.files)
            .field("language", &self.language)
            .finish()
    }
}
