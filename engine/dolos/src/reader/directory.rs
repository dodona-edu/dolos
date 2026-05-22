use csv::Reader;
use std::fs;
use std::io::{Error, ErrorKind, Result};
use std::path::{Path, PathBuf};

pub(super) fn resolve(dir: &Path) -> Result<(String, Vec<PathBuf>)> {
    let csv_path = dir.join("info.csv");
    let files = if csv_path.is_file() {
        resolve_csv(&csv_path)?
    } else {
        collect_recursive(dir)?
    };
    Ok((dir_name(dir), files))
}
fn resolve_csv(csv_path: &Path) -> Result<Vec<PathBuf>> {
    let dir = csv_path.parent().unwrap_or(Path::new("."));
    let invalid = |e| Error::new(ErrorKind::InvalidData, e);
    let mut rdr = Reader::from_path(csv_path).map_err(invalid)?;

    let filename_col = rdr
        .headers()
        .map_err(invalid)?
        .iter()
        .position(|h| h == "filename")
        .ok_or_else(|| Error::new(ErrorKind::InvalidData, "CSV missing 'filename' column"))?;

    let files = rdr
        .records()
        .map(|r| r.map_err(invalid).map(|r| dir.join(&r[filename_col])))
        .collect::<Result<Vec<_>>>()?;

    Ok(files)
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
    fn dir_name_returns_last_component() {
        assert_eq!(dir_name(Path::new("/foo/bar")), "bar");
        assert_eq!(dir_name(Path::new("relative/path")), "path");
    }

    #[test]
    fn collect_recursive_finds_nested_files_in_sorted_order() {
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
    fn resolve_csv_reads_filename_column() {
        let tmp = tempdir().unwrap();
        fs::write(tmp.path().join("a.js"), "").unwrap();
        fs::write(tmp.path().join("b.js"), "").unwrap();
        let csv_path = tmp.path().join("info.csv");
        fs::write(&csv_path, "filename\na.js\nb.js\n").unwrap();

        let files = resolve_csv(&csv_path).unwrap();
        assert_eq!(files.len(), 2);
        assert!(files[0].ends_with("a.js"));
        assert!(files[1].ends_with("b.js"));
    }
}
