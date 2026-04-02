use crate::index::Index;
use crate::language::Language;
use crate::report::Report;
use std::fmt;
use std::path::PathBuf;

/// Configuration for a Dolos analysis run.
pub struct DolosConfig {
    pub k: usize,
    pub w: usize,
    pub min_match_length: usize,
}

impl Default for DolosConfig {
    fn default() -> Self {
        DolosConfig { k: 23, w: 17, min_match_length: 1 }
    }
}

pub struct Dolos {
    index: Index,
}

impl Dolos {
    pub fn from_paths(paths: Vec<PathBuf>, config: DolosConfig) -> Self {
        let first = paths.first().expect("no paths given");
        let language = Language::guess_from_path(first).expect("lang");

        let mut index = Index::new(config.k, config.w, config.min_match_length, language);
        index.add_files(paths);
        Dolos { index }
    }

    pub fn build_report(self) -> Report {
        self.index.build_report()
    }
}

impl fmt::Debug for Dolos {
    fn fmt(&self, fmt: &mut fmt::Formatter) -> fmt::Result {
        fmt.debug_struct("Dolos")
            .field("files", &self.index.files)
            .field("language", &self.index.language)
            .finish()
    }
}
