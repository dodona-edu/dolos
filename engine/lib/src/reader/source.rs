use crate::file::File;
use std::io::{Error, ErrorKind, Result};
use std::path::PathBuf;
use tree_sitter_grammars::Language;

use super::{Input, resolve};

/// A named collection of read source files in one language, ready for analysis.
pub struct Source {
    pub name: String,
    /// The files in input order. Their paths are relative to the input
    /// directory, the directory of the CSV file or the extracted archive.
    pub files: Vec<File>,
    pub language: Language,
}

impl Source {
    /// Create a `Source` from the given input paths, in the forms that
    /// [`Input::open`] accepts.
    ///
    /// Only the files of `language` are kept. When `language` is `None`, the
    /// language that most file extensions belong to is used. The other files,
    /// and the files that cannot be read, are skipped with a warning. Without a
    /// name from the input, the source is named after the files that remain.
    ///
    /// # Errors
    /// Fails when the paths cannot be read, the language cannot be detected or
    /// fewer than 2 readable files remain.
    pub fn create(paths: Vec<PathBuf>, language: Option<Language>) -> Result<Self> {
        let input = Input::open(paths)?;
        let language = match language {
            Some(language) => language,
            None => input.detect_language()?,
        };

        let name = input.name.clone();
        let files = input.read_files(language, "file");
        if files.len() < 2 {
            return Err(Error::new(
                ErrorKind::InvalidInput,
                format!("need at least 2 {} files to compare", language.name()),
            ));
        }

        let name = name.unwrap_or_else(|| {
            let paths: Vec<PathBuf> = files.iter().map(|f| f.relative_path.clone()).collect();
            resolve::files_name(&paths)
        });
        Ok(Self { name, files, language })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rstest::rstest;

    fn relative_paths(source: &Source) -> Vec<PathBuf> {
        source
            .files
            .iter()
            .map(|f| f.relative_path.clone())
            .collect()
    }

    #[test]
    fn create_rejects_empty_input() {
        assert!(Source::create(vec![], None).is_err());
    }

    #[test]
    fn create_rejects_a_single_regular_file() {
        let err = Source::create(vec!["fixtures/sample1.js".into()], None)
            .err()
            .unwrap();
        assert!(err.to_string().contains("at least 2"), "{err}");
    }

    #[test]
    fn create_reads_loose_files() {
        let source = Source::create(
            vec!["fixtures/sample1.js".into(), "fixtures/sample2.js".into()],
            None,
        )
        .unwrap();
        assert_eq!(
            relative_paths(&source),
            vec![
                PathBuf::from("fixtures/sample1.js"),
                PathBuf::from("fixtures/sample2.js"),
            ]
        );
    }

    #[test]
    fn create_names_many_files_by_count() {
        let source = Source::create(
            vec![
                "fixtures/sample1.js".into(),
                "fixtures/sample2.js".into(),
                "fixtures/sample3.js".into(),
            ],
            None,
        )
        .unwrap();
        assert_eq!(source.name, "3 files");
        assert_eq!(source.files.len(), 3);
    }

    #[test]
    fn create_names_the_files_left_after_filtering() {
        let source = Source::create(
            vec![
                "fixtures/sample1.js".into(),
                "fixtures/sample2.js".into(),
                "fixtures/sample1.py".into(),
            ],
            None,
        )
        .unwrap();
        assert_eq!(source.name, "sample1.js-sample2.js");
    }

    #[test]
    fn create_reads_a_directory() {
        let source = Source::create(vec!["fixtures/reader".into()], None).unwrap();
        assert_eq!(source.name, "reader");
        assert_eq!(
            relative_paths(&source),
            vec![PathBuf::from("sample1.js"), PathBuf::from("sample2.js"),]
        );
    }

    #[test]
    fn create_reads_a_csv_file() {
        let source = Source::create(vec!["fixtures/reader/info.csv".into()], None).unwrap();
        assert_eq!(source.name, "reader");
        assert_eq!(
            relative_paths(&source),
            vec![PathBuf::from("sample1.js"), PathBuf::from("sample2.js"),]
        );
    }

    #[rstest]
    #[case::zip("fixtures/reader.zip")]
    #[case::tar("fixtures/reader.tar")]
    #[case::tar_gz("fixtures/reader.tar.gz")]
    #[case::tar_bz2("fixtures/reader.tar.bz2")]
    fn create_reads_an_archive(#[case] path: &str) {
        let source = Source::create(vec![path.into()], None).unwrap();
        assert_eq!(source.name, "reader");

        let mut files = relative_paths(&source);
        files.sort();
        assert_eq!(
            files,
            vec![PathBuf::from("sample1.js"), PathBuf::from("sample2.js")]
        );
    }

    #[test]
    fn create_skips_a_file_that_cannot_be_read() {
        let dir = tempfile::TempDir::new().unwrap();
        std::fs::copy("fixtures/sample1.js", dir.path().join("a.js")).unwrap();
        std::fs::copy("fixtures/sample2.js", dir.path().join("b.js")).unwrap();
        std::fs::write(dir.path().join("c.js"), b"let x = \"\xff\";").unwrap();

        let source = Source::create(vec![dir.path().into()], None).unwrap();

        let mut files = relative_paths(&source);
        files.sort();
        assert_eq!(files, vec![PathBuf::from("a.js"), PathBuf::from("b.js")]);
    }
}
