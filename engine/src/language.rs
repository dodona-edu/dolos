use std::ffi::OsStr;
use std::path::PathBuf;
use crate::file::File;

#[derive(Debug, Eq, PartialEq, Clone, Copy)]
pub enum Language {
    Java
}

impl Language {
    pub fn guess_from_path(path: &PathBuf) -> Option<Language> {
        Self::from_ext(path.extension().expect("file has no extension"))
    }

    pub fn from_ext(ext: &OsStr) -> Option<Language> {
        if ext.eq_ignore_ascii_case("java") {
            Some(Self::Java)
        } else {
            None
        }
    }

    pub fn tree_sitter_language(self) -> tree_sitter::Language {
        match self {
            Language::Java => tree_sitter_java::language()
        }
    }
}


