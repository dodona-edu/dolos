use std::io::{Error, ErrorKind, Result};
use std::path::{Path, PathBuf};
use tempfile::TempDir;

use super::{archive, directory};

/// A named collection of file paths ready for analysis.
///
/// When created from an archive, the extracted files live inside a temporary
/// directory. `_temp_dir` keeps that directory alive for the lifetime of the
/// `Dataset`; it is deleted automatically when the `Dataset` is dropped.
pub struct Dataset {
    pub name: String,
    pub files: Vec<PathBuf>,
    _temp_dir: Option<TempDir>,
}

impl Dataset {
    /// Create a `Dataset` from the given input paths. Accepted inputs:
    ///
    /// - **Multiple paths** → treated as individual files.
    /// - **One directory** → files collected recursively; `info.csv` is honored
    ///   when present at the top level.
    /// - **One archive** (`.zip`, `.tar`, `.tar.gz`, `.tgz`, `.tar.bz2`, `.tbz`,
    ///   `.tbz2`) → extracted to a temporary directory, then treated as a directory.
    pub fn create(paths: Vec<PathBuf>) -> Result<Self> {
        match paths.len() {
            0 => Err(Error::new(
                ErrorKind::InvalidInput,
                "No input paths provided",
            )),
            1 => Self::from_single_path(&paths[0]),
            _ => Self::from_files(paths),
        }
    }

    fn from_single_path(path: &Path) -> Result<Self> {
        if path.is_dir() {
            let (name, files) = directory::resolve(path)?;
            Ok(Self::new(name, files, None))
        } else if let Some(extracted) = archive::try_extract(path)? {
            let (_, files) = directory::resolve(extracted.temp_dir.path())?;
            Ok(Self::new(extracted.name, files, Some(extracted.temp_dir)))
        } else {
            Err(Error::new(
                ErrorKind::InvalidInput,
                "A single path must be a directory or a supported archive \
                 (.zip, .tar, .tar.gz, .tgz, .tar.bz2, .tbz, .tbz2)",
            ))
        }
    }

    fn from_files(paths: Vec<PathBuf>) -> Result<Self> {
        if let Some(path) = paths.iter().find(|p| !p.is_file()) {
            return Err(Error::new(
                ErrorKind::NotFound,
                format!("'{}' is not a file", path.display()),
            ));
        }

        let name = match paths.as_slice() {
            [a, b] => format!(
                "{}-{}",
                a.file_name().unwrap_or_default().to_string_lossy(),
                b.file_name().unwrap_or_default().to_string_lossy(),
            ),
            _ => format!("{} files", paths.len()),
        };

        Ok(Self::new(name, paths, None))
    }

    fn new(name: impl Into<String>, files: Vec<PathBuf>, temp_dir: Option<TempDir>) -> Self {
        Dataset { name: name.into(), files, _temp_dir: temp_dir }
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
        assert_eq!(dataset.files.len(), 2);
    }

    #[test]
    fn name_for_many_files() {
        let dataset = Dataset::create(vec![
            "fixtures/sample1.js".into(),
            "fixtures/sample2.js".into(),
            "fixtures/simple.js".into(),
        ])
        .unwrap();
        assert_eq!(dataset.name, "3 files");
        assert_eq!(dataset.files.len(), 3);
    }

    #[test]
    fn test_create_from_single_directory() {
        let dataset = Dataset::create(vec!["fixtures/reader".into()]).unwrap();
        assert_eq!(dataset.name, "reader");
        let solution: Vec<PathBuf> = vec![
            "fixtures/reader/sample1.js".into(),
            "fixtures/reader/sample2.js".into(),
        ];
        assert_eq!(dataset.files, solution);
    }

    #[rstest]
    #[case::zip("fixtures/reader.zip")]
    #[case::tar("fixtures/reader.tar")]
    #[case::tar_gz("fixtures/reader.tar.gz")]
    #[case::tar_bz2("fixtures/reader.tar.bz2")]
    fn test_create_from_archive(#[case] path: &str) {
        let dataset = Dataset::create(vec![path.into()]).unwrap();
        assert_eq!(dataset.name, "reader");

        // Files live in a temporary directory, so compare names only.
        let mut file_names: Vec<String> = dataset
            .files
            .iter()
            .map(|p| p.file_name().unwrap().to_string_lossy().into_owned())
            .collect();
        file_names.sort();
        assert_eq!(file_names, ["sample1.js", "sample2.js"]);
    }

    #[test]
    fn test_create_from_files() {
        let dataset = Dataset::create(vec![
            "fixtures/sample1.js".into(),
            "fixtures/sample2.js".into(),
        ])
        .unwrap();
        assert_eq!(dataset.name, "sample1.js-sample2.js");
        let solution: Vec<PathBuf> =
            vec!["fixtures/sample1.js".into(), "fixtures/sample2.js".into()];
        assert_eq!(dataset.files, solution);
    }
}
