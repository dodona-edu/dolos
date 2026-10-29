use csv::Reader;
use std::fs;
use std::io::{Error, ErrorKind, Result};
use std::path::{Path, PathBuf};

/// Resolve files from a directory. If an `info.csv` is present at the top
/// level, it is used to determine the file list; otherwise files are collected
/// recursively.
pub fn from_directory(dir: &Path) -> Result<(String, Vec<PathBuf>)> {
    let csv_path = dir.join("info.csv");
    let files = if csv_path.is_file() {
        filenames_from_csv(&csv_path)?
    } else {
        collect_recursive(dir)?
    };
    Ok((dir_name(dir)?, files))
}

/// Resolve files from a CSV file. The name is derived from the CSV's parent
/// directory.
pub fn from_csv(csv_path: &Path) -> Result<(String, Vec<PathBuf>)> {
    let files = filenames_from_csv(csv_path)?;
    Ok((dir_name(csv_dir(csv_path))?, files))
}

/// Resolve files from an explicit list of paths. All paths must be existing
/// files.
pub fn from_files(paths: Vec<PathBuf>) -> Result<Vec<PathBuf>> {
    if let Some(path) = paths.iter().find(|p| !p.is_file()) {
        return Err(Error::new(
            ErrorKind::NotFound,
            format!("'{}' is not a file", path.display()),
        ));
    }
    Ok(paths)
}

/// Name a list of files: `a.js-b.js` for two files, `N files` otherwise.
pub fn files_name(paths: &[PathBuf]) -> String {
    match paths {
        [a, b] => format!(
            "{}-{}",
            a.file_name().unwrap_or_default().to_string_lossy(),
            b.file_name().unwrap_or_default().to_string_lossy(),
        ),
        _ => format!("{} files", paths.len()),
    }
}

fn filenames_from_csv(csv_path: &Path) -> Result<Vec<PathBuf>> {
    let dir = csv_dir(csv_path);
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
    Ok(files)
}

/// Return the directory of a CSV file, or `.` for a bare file name.
fn csv_dir(csv_path: &Path) -> &Path {
    match csv_path.parent() {
        Some(dir) if !dir.as_os_str().is_empty() => dir,
        _ => Path::new("."),
    }
}

/// Return the last component of the canonical form of an existing directory.
fn dir_name(dir: &Path) -> Result<String> {
    let dir = dir.canonicalize().map_err(|e| {
        Error::new(
            e.kind(),
            format!("Could not resolve directory '{}': {e}", dir.display()),
        )
    })?;
    Ok(dir
        .file_name()
        .unwrap_or(dir.as_os_str())
        .to_string_lossy()
        .into_owned())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;

    fn working_directory_name() -> String {
        let cwd = std::env::current_dir().unwrap();
        cwd.file_name().unwrap().to_string_lossy().into_owned()
    }

    #[test]
    fn bare_csv_path_is_named_after_the_working_directory() {
        let name = dir_name(csv_dir(Path::new("info.csv"))).unwrap();
        assert_eq!(name, working_directory_name());
    }

    #[test]
    fn dot_is_named_after_the_working_directory() {
        assert_eq!(dir_name(Path::new(".")).unwrap(), working_directory_name());
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
        let mut names: Vec<_> = files
            .iter()
            .map(|p| p.file_name().unwrap().to_str().unwrap())
            .collect();
        names.sort();
        assert_eq!(names, ["a.txt", "b.txt", "c.txt"]);
    }

    #[test]
    fn test_from_files_errors_on_nonexistent_path() {
        let result = from_files(vec!["does_not_exist.js".into()]);
        assert!(result.is_err());
    }
}
