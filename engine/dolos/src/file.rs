use std::fmt;
use std::hash::{Hash, Hasher};
use std::path::PathBuf;

pub struct File {
    /// Zero-based index assigned in the order the file was added to the analysis.
    pub id: usize,
    pub relative_path: PathBuf,
    /// Source text, stored when fragment display is needed.
    pub content: String,
}

impl Hash for File {
    fn hash<H>(&self, state: &mut H)
    where
        H: Hasher,
    {
        self.relative_path.hash(state);
    }
}

impl PartialEq for File {
    fn eq(&self, other: &Self) -> bool {
        self.relative_path == other.relative_path
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
        self.relative_path.cmp(&other.relative_path)
    }
}

impl fmt::Debug for File {
    fn fmt(&self, fmt: &mut fmt::Formatter) -> fmt::Result {
        fmt.debug_struct("File")
            .field("path", &self.relative_path)
            .finish()
    }
}

/// A set of source files to analyze: a base directory and paths relative to it.
/// The relative paths serve as display paths in the output.
#[derive(Debug, Clone)]
pub struct FileSet {
    pub base_dir: PathBuf,
    pub relative_paths: Vec<PathBuf>,
}

impl FileSet {
    /// Create a `FileSet` from a base directory and a list of full paths.
    /// Each path is stripped of the `base_dir` prefix to produce the relative
    /// (display) paths stored in `relative_paths`.
    pub fn new(base_dir: impl Into<PathBuf>, files: Vec<PathBuf>) -> Self {
        let base_dir = base_dir.into();
        let relative_paths = files
            .into_iter()
            .map(|p| p.strip_prefix(&base_dir).unwrap_or(&p).to_path_buf())
            .collect();
        Self { base_dir, relative_paths }
    }
}
