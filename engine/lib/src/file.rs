use crate::winnowing::fingerprints::Fingerprint;
use crate::winnowing::region::Region;
use std::collections::HashMap;
use std::fmt;
use std::hash::{Hash, Hasher};
use std::io::{Error, ErrorKind, Result};
use std::ops::Range;
use std::path::PathBuf;
use tree_sitter_grammars::Language;

#[derive(Clone)]
pub struct File {
    /// Zero-based index assigned in the order the file was added to the analysis.
    pub id: usize,
    pub relative_path: PathBuf,
    /// Full source text of the file.
    pub content: String,
    /// The data needed to rerun the analysis for this file, present when
    /// `include_analysis_data` is set.
    pub analysis_data: Option<AnalysisData>,
}

/// Everything the analysis engine needs for one file, exported so that a pair
/// can be analysed again from the report alone.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AnalysisData {
    /// The file's winnowed fingerprint sequence.
    pub fingerprints: Vec<Fingerprint>,
    /// The source region of each fingerprint (same length as `fingerprints`).
    pub regions: Vec<Region>,
    /// The ignored fingerprint positions, as half-open intervals.
    pub ignored: Vec<Range<usize>>,
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

    /// Detect the language that the most file extensions belong to.
    ///
    /// # Errors
    /// Fails when no file has a known extension, or when several languages share the highest count.
    pub fn detect_language(&self) -> Result<Language> {
        let mut counts: HashMap<Language, usize> = HashMap::new();
        for path in &self.relative_paths {
            for language in Language::from_path(path) {
                *counts.entry(language).or_default() += 1;
            }
        }

        let Some(&max) = counts.values().max() else {
            return Err(Error::new(
                ErrorKind::InvalidInput,
                "Could not detect the language: no file has a known extension. Specify the language explicitly.",
            ));
        };

        let mut winners: Vec<Language> = counts
            .into_iter()
            .filter(|&(_, count)| count == max)
            .map(|(language, _)| language)
            .collect();
        winners.sort();
        match winners[..] {
            [language] => Ok(language),
            _ => Err(Error::new(
                ErrorKind::InvalidInput,
                format!(
                    "Could not detect the language: {winners:?} each match {max} files. Specify the language explicitly."
                ),
            )),
        }
    }

    /// Keep only the files whose extension belongs to `language`.
    pub fn retain_language(&mut self, language: Language) {
        self.relative_paths.retain(|path| language.matches(path));
    }
}

#[cfg(test)]
mod tests {
    use super::FileSet;
    use rstest::rstest;
    use std::path::PathBuf;
    use tree_sitter_grammars::Language;

    fn file_set(paths: &[&str]) -> FileSet {
        FileSet::new("", paths.iter().map(PathBuf::from).collect())
    }

    #[rstest]
    #[case::cpp_with_headers(&["a.cpp", "b.cpp", "c.cpp", "d.cpp", "a.h", "b.h", "c.h"], Language::Cpp)]
    #[case::c_with_headers(&["a.c", "b.c", "a.h", "b.h", "c.h"], Language::C)]
    #[case::unknown_majority(&["a.py", "b.py", "x.md", "y.md", "z.md"], Language::Python)]
    #[case::no_extension(&["Makefile", "a.py"], Language::Python)]
    fn detect_language_picks_majority(#[case] paths: &[&str], #[case] expected: Language) {
        assert_eq!(file_set(paths).detect_language().unwrap(), expected);
    }

    #[test]
    fn detect_language_rejects_a_tie() {
        let err = file_set(&["a.h", "b.h", "c.h"])
            .detect_language()
            .unwrap_err();
        assert!(err.to_string().contains("[C, Cpp]"), "{err}");
    }

    #[test]
    fn detect_language_rejects_unknown_extensions() {
        let err = file_set(&["README.md", "Makefile"])
            .detect_language()
            .unwrap_err();
        assert!(
            err.to_string().contains("no file has a known extension"),
            "{err}"
        );
    }

    #[test]
    fn retain_language_keeps_matching_files() {
        let mut files = file_set(&["a.cpp", "README.md", "b.h", ".gitignore", "Makefile"]);
        files.retain_language(Language::Cpp);
        assert_eq!(
            files.relative_paths,
            [PathBuf::from("a.cpp"), PathBuf::from("b.h")]
        );
    }
}
