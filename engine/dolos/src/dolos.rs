use crate::file::FileSet;
use crate::index::Index;
use crate::report::Report;
use std::fmt;
use tree_sitter_grammars::guess_grammar_from_path;

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
    pub fn from_file_set(file_set: FileSet, config: DolosConfig) -> Self {
        let language =
            guess_grammar_from_path(file_set.relative_paths.first().expect("no files given"))
                .expect("lang");

        let keep_fragments = file_set.relative_paths.len() == 2;
        let mut index = Index::new(
            config.k,
            config.w,
            keep_fragments,
            config.min_match_length,
            language,
        );
        index.add_files(file_set);
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
