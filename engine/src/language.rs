use std::ffi::OsStr;
use std::path::Path;

#[derive(Debug, Eq, PartialEq, Clone, Copy)]
pub enum Language {
    Java,
    C,
    Javascript,
    Python,
}

impl Language {
    pub fn guess_from_path(path: &Path) -> Option<Language> {
        Self::from_ext(path.extension().expect("file has no extension"))
    }

    pub fn matches(&self, path: &Path) -> bool {
        if let Some(lang) = Self::guess_from_path(path) {
            return self == &lang;
        };
        false
    }

    pub fn from_ext(ext: &OsStr) -> Option<Language> {
        match ext.to_ascii_lowercase().to_str() {
            Some("java") => Some(Self::Java),
            Some("c") => Some(Self::C),
            Some("js") => Some(Self::Javascript),
            Some("py") | Some("py3") => Some(Self::Python),
            _ => None,
        }
    }

    pub fn tree_sitter_language(self) -> tree_sitter_language::LanguageFn {
        match self {
            Language::Java => tree_sitter_java::LANGUAGE,
            Language::C => tree_sitter_c::LANGUAGE,
            Language::Javascript => tree_sitter_javascript::LANGUAGE,
            Language::Python => tree_sitter_python::LANGUAGE,
        }
    }
}
