use crate::file::FileSet;
use std::io::{Error, ErrorKind, Result};
use std::path::{Path, PathBuf};
use tempfile::TempDir;
use tree_sitter_grammars::Language;

use super::{archive, resolve};

/// A named collection of source files in one language, ready for analysis.
///
/// `file_set` holds the base directory and the paths relative to it.
/// The relative paths are also the display paths used in the output.
///
/// When created from an archive, `_temp_dir` keeps the extracted directory
/// alive for the lifetime of the `Dataset`.
pub struct Dataset {
    pub name: String,
    pub file_set: FileSet,
    pub language: Language,
    _temp_dir: Option<TempDir>,
}

impl Dataset {
    /// Create a `Dataset` from the given input paths. Accepted inputs:
    ///
    /// - **Multiple paths** → treated as individual files.
    /// - **One directory** → files collected recursively; `info.csv` is honored
    ///   when present at the top level.
    /// - **One CSV file** → file list read from the `filename` column.
    /// - **One archive** (`.zip`, `.tar`, `.tar.gz`, `.tgz`, `.tar.bz2`, `.tbz`,
    ///   `.tbz2`) → extracted to a temporary directory, then treated as a directory.
    ///
    /// Only the files of `language` are kept. When `language` is `None`, the
    /// language that most file extensions belong to is used.
    pub fn create(paths: Vec<PathBuf>, language: Option<Language>) -> Result<Self> {
        match paths.as_slice() {
            [] => Err(Error::new(
                ErrorKind::InvalidInput,
                "No input paths provided",
            )),
            [path] => Self::from_single_path(path, language),
            _ => Self::from_multi_path(paths, language),
        }
    }

    fn from_multi_path(paths: Vec<PathBuf>, language: Option<Language>) -> Result<Self> {
        let files = resolve::from_files(paths)?;
        Self::new(None, FileSet::new(PathBuf::new(), files), None, language)
    }

    fn from_single_path(path: &Path, language: Option<Language>) -> Result<Self> {
        // directory
        if path.is_dir() {
            let (name, files) = resolve::from_directory(path)?;
            return Self::new(Some(name), FileSet::new(path, files), None, language);
        }

        // CSV file
        if path.extension().is_some_and(|ext| ext == "csv") {
            let (name, files) = resolve::from_csv(path)?;
            let base_dir = path.parent().unwrap_or(Path::new("."));
            return Self::new(Some(name), FileSet::new(base_dir, files), None, language);
        }

        // archive
        if let Some(extracted) = archive::try_extract(path)? {
            let dir = extracted.temp_dir.path();
            let (_, files) = resolve::from_directory(dir)?;
            return Self::new(
                Some(extracted.name),
                FileSet::new(dir, files),
                Some(extracted.temp_dir),
                language,
            );
        }

        Err(Error::new(
            ErrorKind::InvalidInput,
            "A single path must be a directory, a CSV file, or a supported archive \
                 (.zip, .tar, .tar.gz, .tgz, .tar.bz2, .tbz, .tbz2)",
        ))
    }

    /// Select the language and keep only the files of that language.
    /// Without a `name`, the dataset is named after the files that remain.
    ///
    /// # Errors
    /// Fails when the language cannot be detected or fewer than 2 files remain.
    fn new(
        name: Option<String>,
        mut file_set: FileSet,
        temp_dir: Option<TempDir>,
        language: Option<Language>,
    ) -> Result<Self> {
        let language = match language {
            Some(language) => language,
            None => file_set.detect_language()?,
        };

        file_set.retain_language(language);
        if file_set.relative_paths.len() < 2 {
            return Err(Error::new(
                ErrorKind::InvalidInput,
                format!("Need at least 2 {language:?} files to compare."),
            ));
        }

        let name = name.unwrap_or_else(|| resolve::files_name(&file_set.relative_paths));
        Ok(Self { name, file_set, language, _temp_dir: temp_dir })
    }
}

#[cfg(test)]
mod tests {
    use super::Dataset;
    use rstest::rstest;
    use std::path::PathBuf;

    #[test]
    fn create_errors_on_empty_input() {
        assert!(Dataset::create(vec![], None).is_err());
    }

    #[test]
    fn create_errors_on_single_regular_file() {
        let result = Dataset::create(vec!["fixtures/sample1.js".into()], None);
        assert!(result.is_err());
    }

    #[test]
    fn name_for_two_files() {
        let dataset = Dataset::create(
            vec!["fixtures/sample1.js".into(), "fixtures/sample2.js".into()],
            None,
        )
        .unwrap();
        assert_eq!(dataset.name, "sample1.js-sample2.js");
        assert_eq!(dataset.file_set.relative_paths.len(), 2);
    }

    #[test]
    fn name_for_many_files() {
        let dataset = Dataset::create(
            vec![
                "fixtures/sample1.js".into(),
                "fixtures/sample2.js".into(),
                "fixtures/sample3.js".into(),
            ],
            None,
        )
        .unwrap();
        assert_eq!(dataset.name, "3 files");
        assert_eq!(dataset.file_set.relative_paths.len(), 3);
    }

    #[test]
    fn name_for_files_after_filtering() {
        let dataset = Dataset::create(
            vec![
                "fixtures/sample1.js".into(),
                "fixtures/sample2.js".into(),
                "fixtures/sample1.py".into(),
            ],
            None,
        )
        .unwrap();
        assert_eq!(dataset.name, "sample1.js-sample2.js");
    }

    #[test]
    fn test_dataset_from_single_directory() {
        let dataset = Dataset::create(vec!["fixtures/reader".into()], None).unwrap();
        assert_eq!(dataset.name, "reader");
        assert_eq!(dataset.file_set.base_dir, PathBuf::from("fixtures/reader"));
        assert_eq!(
            dataset.file_set.relative_paths,
            vec![PathBuf::from("sample1.js"), PathBuf::from("sample2.js"),]
        );
    }

    #[test]
    fn test_dataset_from_csv() {
        let dataset = Dataset::create(vec!["fixtures/reader/info.csv".into()], None).unwrap();
        assert_eq!(dataset.name, "reader");
        assert_eq!(dataset.file_set.base_dir, PathBuf::from("fixtures/reader"));
        assert_eq!(
            dataset.file_set.relative_paths,
            vec![PathBuf::from("sample1.js"), PathBuf::from("sample2.js"),]
        );
    }

    #[rstest]
    #[case::zip("fixtures/reader.zip")]
    #[case::tar("fixtures/reader.tar")]
    #[case::tar_gz("fixtures/reader.tar.gz")]
    #[case::tar_bz2("fixtures/reader.tar.bz2")]
    fn test_dataset_from_archive(#[case] path: &str) {
        let dataset = Dataset::create(vec![path.into()], None).unwrap();
        assert_eq!(dataset.name, "reader");

        let mut files = dataset.file_set.relative_paths.clone();
        files.sort();
        assert_eq!(files.len(), 2);
        assert_eq!(files[0], PathBuf::from("sample1.js"));
        assert_eq!(files[1], PathBuf::from("sample2.js"));
    }

    #[test]
    fn test_dataset_from_files() {
        let dataset = Dataset::create(
            vec!["fixtures/sample1.js".into(), "fixtures/sample2.js".into()],
            None,
        )
        .unwrap();
        assert_eq!(dataset.name, "sample1.js-sample2.js");
        assert_eq!(dataset.file_set.base_dir, PathBuf::new());
        assert_eq!(
            dataset.file_set.relative_paths,
            vec![
                PathBuf::from("fixtures/sample1.js"),
                PathBuf::from("fixtures/sample2.js"),
            ]
        );
    }
}
