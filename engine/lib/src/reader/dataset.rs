use crate::file::FileSet;
use std::io::{Error, ErrorKind, Result};
use std::path::PathBuf;
use tempfile::TempDir;
use tree_sitter_grammars::Language;

use super::{Input, resolve};

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
    /// Create a `Dataset` from the given input paths, in the forms that
    /// [`Input::read`] accepts.
    ///
    /// Only the files of `language` are kept. When `language` is `None`, the
    /// language that most file extensions belong to is used. Without a name
    /// from the input, the dataset is named after the files that remain.
    ///
    /// # Errors
    /// Fails when the paths cannot be read, the language cannot be detected or
    /// fewer than 2 files remain.
    pub fn create(paths: Vec<PathBuf>, language: Option<Language>) -> Result<Self> {
        let Input { name, mut file_set, temp_dir } = Input::read(paths)?;

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
    use super::*;
    use rstest::rstest;

    #[test]
    fn create_rejects_empty_input() {
        assert!(Dataset::create(vec![], None).is_err());
    }

    #[test]
    fn create_rejects_a_single_regular_file() {
        let err = Dataset::create(vec!["fixtures/sample1.js".into()], None)
            .err()
            .unwrap();
        assert!(err.to_string().contains("at least 2"), "{err}");
    }

    #[test]
    fn create_reads_loose_files() {
        let dataset = Dataset::create(
            vec!["fixtures/sample1.js".into(), "fixtures/sample2.js".into()],
            None,
        )
        .unwrap();
        assert_eq!(dataset.file_set.base_dir, PathBuf::new());
        assert_eq!(
            dataset.file_set.relative_paths,
            vec![
                PathBuf::from("fixtures/sample1.js"),
                PathBuf::from("fixtures/sample2.js"),
            ]
        );
    }

    #[test]
    fn create_names_many_files_by_count() {
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
    fn create_names_the_files_left_after_filtering() {
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
    fn create_reads_a_directory() {
        let dataset = Dataset::create(vec!["fixtures/reader".into()], None).unwrap();
        assert_eq!(dataset.name, "reader");
        assert_eq!(dataset.file_set.base_dir, PathBuf::from("fixtures/reader"));
        assert_eq!(
            dataset.file_set.relative_paths,
            vec![PathBuf::from("sample1.js"), PathBuf::from("sample2.js"),]
        );
    }

    #[test]
    fn create_reads_a_csv_file() {
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
    fn create_reads_an_archive(#[case] path: &str) {
        let dataset = Dataset::create(vec![path.into()], None).unwrap();
        assert_eq!(dataset.name, "reader");

        let mut files = dataset.file_set.relative_paths.clone();
        files.sort();
        assert_eq!(
            files,
            vec![PathBuf::from("sample1.js"), PathBuf::from("sample2.js")]
        );
    }
}
