use std::ffi::OsStr;

#[derive(Debug)]
pub enum Language {
    Java,
}

impl Language {
    pub fn from_ext(ext: &OsStr) -> Option<Language> {
        if ext.eq_ignore_ascii_case("java") {
            Some(Language::Java)
        } else {
            None
        }
    }
}


