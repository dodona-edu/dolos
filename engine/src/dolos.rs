use crate::language::Language;
use crate::winnowing::index::Index;
use crate::winnowing::pair::Pair;
use crate::winnowing::report::Report;
use std::fmt;
use std::path::PathBuf;

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

    pub fn build_report(&self) -> Report {
        self.index.build_report()
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
