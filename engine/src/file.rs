use std::fmt;
use std::hash::{Hash, Hasher};
use std::path::{Path, PathBuf};

use crate::language::Language;

pub struct File {
    pub path: PathBuf,
    pub language: Language,
}

impl File {
    pub fn read<P: AsRef<Path>>(path: P) -> std::io::Result<String> {
        std::fs::read_to_string(path)
    }

    pub fn file_name(&self) -> &str {
        self.path
            .as_path()
            .file_name()
            .expect("should be a file")
            .to_str()
            .expect("should be valid UTF-8")
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
        Some(self.cmp(other))
    }
}

impl Ord for File {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        self.path.cmp(&other.path)
    }
}

impl fmt::Debug for File {
    fn fmt(&self, fmt: &mut fmt::Formatter) -> fmt::Result {
        fmt.debug_struct("File").field("path", &self.path).finish()
    }
}
