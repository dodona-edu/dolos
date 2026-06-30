use crate::file::FileSet;
use std::io::{Error, ErrorKind, Result};
use std::path::{Path, PathBuf};
use tempfile::TempDir;

use super::{archive, resolve};

/// A named collection of source files ready for analysis.
///
/// `file_set` holds the base directory and the paths relative to it.
/// The relative paths are also the display paths used in the output.
///
/// When created from an archive, `_temp_dir` keeps the extracted directory
/// alive for the lifetime of the `Dataset`.
pub struct Dataset {
    pub name: String,
    pub file_set: FileSet,
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
    pub fn create(paths: Vec<PathBuf>) -> Result<Self> {
        match paths.as_slice() {
            [] => Err(Error::new(
                ErrorKind::InvalidInput,
                "No input paths provided",
            )),
            [path] => Self::from_single_path(path),
            _ => Self::from_multi_path(paths),
        }
    }

    fn from_multi_path(paths: Vec<PathBuf>) -> Result<Self> {
        let (name, files) = resolve::from_files(paths)?;
        // No shared root — base_dir is empty, so joining is a no-op.
        Ok(Self {
            name,
            file_set: FileSet::new(PathBuf::new(), files),
            _temp_dir: None,
        })
    }

    fn from_single_path(path: &Path) -> Result<Self> {
        if path.is_dir() {
            let (name, files) = resolve::from_directory(path)?;
            Ok(Self { name, file_set: FileSet::new(path, files), _temp_dir: None })
        } else if path.extension().is_some_and(|ext| ext == "csv") {
            let (name, files) = resolve::from_csv(path)?;
            Ok(Self {
                name,
                file_set: FileSet::new(path.parent().unwrap_or(Path::new(".")), files),
                _temp_dir: None,
            })
        } else if let Some(extracted) = archive::try_extract(path)? {
            let (_, files) = resolve::from_directory(extracted.temp_dir.path())?;
            Ok(Self {
                name: extracted.name,
                file_set: FileSet::new(extracted.temp_dir.path(), files),
                _temp_dir: Some(extracted.temp_dir),
            })
        } else {
            Err(Error::new(
                ErrorKind::InvalidInput,
                "A single path must be a directory, a CSV file, or a supported archive \
                 (.zip, .tar, .tar.gz, .tgz, .tar.bz2, .tbz, .tbz2)",
            ))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::Dataset;
    use rstest::rstest;
    use std::path::PathBuf;

    #[test]
    fn create_errors_on_empty_input() {
        assert!(Dataset::create(vec![]).is_err());
    }

    #[test]
    fn create_errors_on_single_regular_file() {
        let result = Dataset::create(vec!["fixtures/sample1.js".into()]);
        assert!(result.is_err());
    }

    #[test]
    fn name_for_two_files() {
        let dataset = Dataset::create(vec![
            "fixtures/sample1.js".into(),
            "fixtures/sample2.js".into(),
        ])
        .unwrap();
        assert_eq!(dataset.name, "sample1.js-sample2.js");
        assert_eq!(dataset.file_set.relative_paths.len(), 2);
    }

    #[test]
    fn name_for_many_files() {
        let dataset = Dataset::create(vec![
            "fixtures/sample1.js".into(),
            "fixtures/sample2.js".into(),
            "fixtures/sample3.js".into(),
        ])
        .unwrap();
        assert_eq!(dataset.name, "3 files");
        assert_eq!(dataset.file_set.relative_paths.len(), 3);
    }

    #[test]
    fn test_dataset_from_single_directory() {
        let dataset = Dataset::create(vec!["fixtures/reader".into()]).unwrap();
        assert_eq!(dataset.name, "reader");
        assert_eq!(dataset.file_set.base_dir, PathBuf::from("fixtures/reader"));
        assert_eq!(
            dataset.file_set.relative_paths,
            vec![PathBuf::from("sample1.js"), PathBuf::from("sample2.js"),]
        );
    }

    #[test]
    fn test_dataset_from_csv() {
        let dataset = Dataset::create(vec!["fixtures/reader/info.csv".into()]).unwrap();
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
        let dataset = Dataset::create(vec![path.into()]).unwrap();
        assert_eq!(dataset.name, "reader");

        let mut files = dataset.file_set.relative_paths.clone();
        files.sort();
        assert_eq!(files.len(), 2);
        assert_eq!(files[0], PathBuf::from("sample1.js"));
        assert_eq!(files[1], PathBuf::from("sample2.js"));
    }

    #[test]
    fn test_dataset_from_files() {
        let dataset = Dataset::create(vec![
            "fixtures/sample1.js".into(),
            "fixtures/sample2.js".into(),
        ])
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
