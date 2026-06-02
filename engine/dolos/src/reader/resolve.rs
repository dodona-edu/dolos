use csv::Reader;
use std::fs;
use std::io::{Error, ErrorKind, Result};
use std::path::{Path, PathBuf};

/// Resolve files from a directory. If an `info.csv` is present at the top
/// level, it is used to determine the file list; otherwise files are collected
/// recursively.
pub(super) fn from_directory(dir: &Path) -> Result<(String, Vec<PathBuf>)> {
    let csv_path = dir.join("info.csv");
    let files = if csv_path.is_file() {
        filenames_from_csv(&csv_path)?
    } else {
        collect_recursive(dir)?
    };
    Ok((dir_name(dir), files))
}

/// Resolve files from a CSV file. The name is derived from the CSV's parent
/// directory.
pub(super) fn from_csv(csv_path: &Path) -> Result<(String, Vec<PathBuf>)> {
    let name = csv_path
        .parent()
        .map(dir_name)
        .unwrap_or_else(|| "unknown".to_owned());
    let files = filenames_from_csv(csv_path)?;
    Ok((name, files))
}

/// Resolve files from an explicit list of paths. All paths must be existing
/// files. The name is derived from the file names.
pub(super) fn from_files(paths: Vec<PathBuf>) -> Result<(String, Vec<PathBuf>)> {
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

    Ok((name, paths))
}

fn filenames_from_csv(csv_path: &Path) -> Result<Vec<PathBuf>> {
    let dir = csv_path.parent().unwrap_or(Path::new("."));
    let invalid = |e| Error::new(ErrorKind::InvalidData, e);
    let mut rdr = Reader::from_path(csv_path).map_err(invalid)?;

    let filename_col = rdr
        .headers()
        .map_err(invalid)?
        .iter()
        .position(|h| h == "filename")
        .ok_or_else(|| Error::new(ErrorKind::InvalidData, "CSV missing 'filename' column"))?;

    rdr.records()
        .map(|r| r.map_err(invalid).map(|r| dir.join(&r[filename_col])))
        .collect()
}

fn collect_recursive(dir: &Path) -> Result<Vec<PathBuf>> {
    let mut files = Vec::new();
    let mut pending = vec![dir.to_path_buf()];
    while let Some(current) = pending.pop() {
        for entry in fs::read_dir(&current)? {
            let path = entry?.path();
            if path.is_dir() {
                pending.push(path);
            } else {
                files.push(path);
            }
        }
    }
    files.sort();
    Ok(files)
}

fn dir_name(dir: &Path) -> String {
    dir.file_name()
        .unwrap_or(dir.as_os_str())
        .to_string_lossy()
        .into_owned()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn test_dir_name() {
        assert_eq!(dir_name(Path::new("/foo/bar")), "bar");
        assert_eq!(dir_name(Path::new("relative/path")), "path");
    }

    #[test]
    fn test_collect_recursive_finds_nested_files() {
        let tmp = tempdir().unwrap();
        fs::write(tmp.path().join("b.txt"), "").unwrap();
        fs::write(tmp.path().join("a.txt"), "").unwrap();
        let sub = tmp.path().join("sub");
        fs::create_dir(&sub).unwrap();
        fs::write(sub.join("c.txt"), "").unwrap();

        let files = collect_recursive(tmp.path()).unwrap();
        let names: Vec<_> = files
            .iter()
            .map(|p| p.file_name().unwrap().to_str().unwrap())
            .collect();
        assert_eq!(names, ["a.txt", "b.txt", "c.txt"]);
    }

    #[test]
    fn test_from_files_errors_on_nonexistent_path() {
        let result = from_files(vec!["does_not_exist.js".into()]);
        assert!(result.is_err());
    }
}
