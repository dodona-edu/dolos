use std::ffi::OsStr;
use std::path::PathBuf;

#[derive(Debug, Eq, PartialEq, Clone, Copy)]
pub enum Language {
    Java,
    Javascript,
    Python,
}

impl Language {
    pub fn guess_from_path(path: &PathBuf) -> Option<Language> {
        Self::from_ext(path.extension().expect("file has no extension"))
    }

    pub fn from_ext(ext: &OsStr) -> Option<Language> {
        if ext.eq_ignore_ascii_case("java") {
            Some(Self::Java)
        } else if ext.eq_ignore_ascii_case("js") {
            Some(Self::Javascript)
        } else if ext.eq_ignore_ascii_case("py") || ext.eq_ignore_ascii_case("py3") {
            Some(Self::Python)
        } else {
            None
        }
    }

    pub fn tree_sitter_language(self) -> tree_sitter::Language {
        match self {
            Language::Java => tree_sitter_java::language(),
            Language::Javascript => tree_sitter_javascript::language(),
            Language::Python => tree_sitter_python::language(),
        }
    }
}
