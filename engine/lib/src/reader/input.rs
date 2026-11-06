use crate::file::FileSet;
use std::io::{Error, ErrorKind, Result};
use std::path::{Path, PathBuf};
use tempfile::TempDir;

use super::{archive, resolve};

/// The files that a list of input paths points to.
#[derive(Debug)]
pub struct Input {
    /// The name of the directory, the CSV file or the archive. `None` for
    /// separate files.
    pub name: Option<String>,
    pub file_set: FileSet,
    /// The extracted archive. The extracted files exist as long as it lives.
    pub temp_dir: Option<TempDir>,
}

impl Input {
    /// Read the files of `paths`. Accepted inputs:
    ///
    /// - **Several paths** or **one regular file** → each path is a file.
    /// - **One directory** → files collected recursively; `info.csv` is honored
    ///   when present at the top level.
    /// - **One CSV file** → file list read from the `filename` column.
    /// - **One archive** (`.zip`, `.tar`, `.tar.gz`, `.tgz`, `.tar.bz2`, `.tbz`,
    ///   `.tbz2`) → extracted to a temporary directory, then treated as a directory.
    pub fn read(paths: Vec<PathBuf>) -> Result<Self> {
        match paths.as_slice() {
            [] => Err(Error::new(
                ErrorKind::InvalidInput,
                "No input paths provided",
            )),
            [path] if path.is_dir() => Self::from_directory(path),
            [path] if path.extension().is_some_and(|ext| ext == "csv") => Self::from_csv(path),
            [path] => match archive::try_extract(path)? {
                Some(extracted) => Self::from_archive(extracted),
                None => Self::from_files(paths),
            },
            _ => Self::from_files(paths),
        }
    }

    fn from_files(paths: Vec<PathBuf>) -> Result<Self> {
        let files = resolve::from_files(paths)?;
        Ok(Self {
            name: None,
            file_set: FileSet::new(PathBuf::new(), files),
            temp_dir: None,
        })
    }

    fn from_directory(dir: &Path) -> Result<Self> {
        let (name, files) = resolve::from_directory(dir)?;
        Ok(Self {
            name: Some(name),
            file_set: FileSet::new(dir, files),
            temp_dir: None,
        })
    }

    fn from_csv(csv_path: &Path) -> Result<Self> {
        let (name, files) = resolve::from_csv(csv_path)?;
        let base_dir = csv_path.parent().unwrap_or(Path::new("."));
        Ok(Self {
            name: Some(name),
            file_set: FileSet::new(base_dir, files),
            temp_dir: None,
        })
    }

    fn from_archive(extracted: archive::ExtractionResult) -> Result<Self> {
        let dir = extracted.temp_dir.path();
        let (_, files) = resolve::from_directory(dir)?;
        Ok(Self {
            name: Some(extracted.name),
            file_set: FileSet::new(dir, files),
            temp_dir: Some(extracted.temp_dir),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn read_accepts_a_single_regular_file() {
        let input = Input::read(vec!["fixtures/sample1.js".into()]).unwrap();
        assert_eq!(input.name, None);
        assert_eq!(
            input.file_set.relative_paths,
            [PathBuf::from("fixtures/sample1.js")]
        );
    }

    #[test]
    fn read_rejects_a_missing_single_path() {
        let err = Input::read(vec!["does_not_exist.js".into()]).unwrap_err();
        assert_eq!(err.kind(), ErrorKind::NotFound);
    }
}
