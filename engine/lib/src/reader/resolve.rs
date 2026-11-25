use crate::error::context;
use crate::file::FileInfo;
use csv::{Reader, StringRecord};
use std::fs;
use std::io::{Error, ErrorKind, Result};
use std::path::{Path, PathBuf};
use std::sync::Arc;

/// Resolve files from a directory. If an `info.csv` is present at the top
/// level, it is used to determine the file list; otherwise files are collected
/// recursively.
pub fn from_directory(dir: &Path) -> Result<(String, Vec<(PathBuf, FileInfo)>)> {
    let csv_path = dir.join("info.csv");
    let files = if csv_path.is_file() {
        files_from_csv(&csv_path)?
    } else {
        without_info(collect_recursive(dir)?)
    };
    Ok((dir_name(dir)?, files))
}

/// Resolve files from a CSV file. The name is derived from the CSV's parent
/// directory.
pub fn from_csv(csv_path: &Path) -> Result<(String, Vec<(PathBuf, FileInfo)>)> {
    let files = files_from_csv(csv_path)?;
    Ok((dir_name(csv_dir(csv_path))?, files))
}

/// Resolve files from an explicit list of paths. All paths must be existing
/// files.
pub fn from_files(paths: Vec<PathBuf>) -> Result<Vec<(PathBuf, FileInfo)>> {
    if let Some(path) = paths.iter().find(|p| !p.is_file()) {
        return Err(Error::new(
            ErrorKind::NotFound,
            format!("'{}' is not a file", path.display()),
        ));
    }
    Ok(without_info(paths))
}

/// Give each of `paths` an empty [`FileInfo`].
fn without_info(paths: Vec<PathBuf>) -> Vec<(PathBuf, FileInfo)> {
    paths
        .into_iter()
        .map(|path| (path, FileInfo::default()))
        .collect()
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

/// Read the path and the [`FileInfo`] of each row of a CSV file.
fn files_from_csv(csv_path: &Path) -> Result<Vec<(PathBuf, FileInfo)>> {
    let dir = csv_dir(csv_path);
    let invalid = |e: csv::Error| {
        let message = format!("could not read the csv file '{}': {e}", csv_path.display());
        Error::new(ErrorKind::InvalidData, message)
    };
    let mut rdr = Reader::from_path(csv_path).map_err(invalid)?;

    let headers = rdr.headers().map_err(invalid)?;
    let filename_col = headers
        .iter()
        .position(|h| h == "filename")
        .ok_or_else(|| {
            let message = format!("csv file '{}' has no 'filename' column", csv_path.display());
            Error::new(ErrorKind::InvalidData, message)
        })?;
    let columns: Arc<[String]> = without_field(headers, filename_col)
        .map(str::to_owned)
        .collect();

    rdr.records()
        .map(|r| {
            let record = r.map_err(invalid)?;
            let path = dir.join(&record[filename_col]);
            let values = without_field(&record, filename_col)
                .map(str::to_owned)
                .collect();
            Ok((path, FileInfo::from_row(Arc::clone(&columns), values)))
        })
        .collect()
}

/// Iterate over the fields of `record`, without the field at `skipped`.
fn without_field(record: &StringRecord, skipped: usize) -> impl Iterator<Item = &str> {
    record
        .iter()
        .enumerate()
        .filter(move |(index, _)| *index != skipped)
        .map(|(_, field)| field)
}

fn collect_recursive(dir: &Path) -> Result<Vec<PathBuf>> {
    let mut files = Vec::new();
    let mut pending = vec![dir.to_path_buf()];
    while let Some(current) = pending.pop() {
        let read_error = |e| {
            context(
                e,
                format!("could not read directory '{}'", current.display()),
            )
        };
        for entry in fs::read_dir(&current).map_err(read_error)? {
            let path = entry.map_err(read_error)?.path();
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
        context(
            e,
            format!("could not resolve directory '{}'", dir.display()),
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
    use tempfile::tempdir;

    #[test]
    fn file_info_keeps_the_other_columns_verbatim_and_in_order() {
        let tmp = tempdir().unwrap();
        let csv_path = tmp.path().join("info.csv");
        fs::write(&csv_path, "labels,filename,full_name\n a;b ,a.js,\n").unwrap();

        let (_, info) = &files_from_csv(&csv_path).unwrap()[0];
        let columns: Vec<_> = info.iter().collect();
        assert_eq!(columns, [("labels", " a;b "), ("full_name", "")]);
    }

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
    fn collect_recursive_finds_nested_files() {
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
}
