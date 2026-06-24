use bzip2::read::BzDecoder;
use flate2::read::GzDecoder;
use std::fs::File;
use std::io::{Error, ErrorKind, Result};
use std::path::Path;
use tar::Archive;
use tempfile::{TempDir, tempdir};
use zip::ZipArchive;

pub struct ExtractionResult {
    pub name: String,
    pub temp_dir: TempDir,
}

pub fn try_extract(path: &Path) -> Result<Option<ExtractionResult>> {
    let Some((format, ext)) = Format::detect(path) else {
        return Ok(None);
    };
    let temp_dir = tempdir()?;
    format.extract(path, temp_dir.path())?;
    let raw = path
        .file_name()
        .unwrap_or(path.as_os_str())
        .to_string_lossy();
    let name = raw[..raw.len() - ext.len()].to_owned();
    Ok(Some(ExtractionResult { name, temp_dir }))
}

#[derive(Clone, Copy)]
enum Format {
    Zip,
    Tar,
    TarGz,
    TarBz2,
}

impl Format {
    /// Ordered longest-first so `.tar.gz` is matched before `.gz`, etc.
    const EXTENSIONS: &'static [(&'static str, Self)] = &[
        (".tar.gz", Self::TarGz),
        (".tar.bz2", Self::TarBz2),
        (".tgz", Self::TarGz),
        (".tbz2", Self::TarBz2),
        (".tbz", Self::TarBz2),
        (".zip", Self::Zip),
        (".tar", Self::Tar),
    ];

    fn detect(path: &Path) -> Option<(Self, &'static str)> {
        let name = path.file_name()?.to_string_lossy().to_lowercase();
        Self::EXTENSIONS
            .iter()
            .find_map(|(ext, fmt)| name.ends_with(ext).then_some((*fmt, *ext)))
    }

    fn extract(self, src: &Path, dest: &Path) -> Result<()> {
        let file = File::open(src)?;
        match self {
            Self::Zip => ZipArchive::new(file)
                .map_err(|e| Error::new(ErrorKind::InvalidData, e))?
                .extract(dest)
                .map_err(Error::other),
            Self::Tar => Archive::new(file).unpack(dest),
            Self::TarGz => Archive::new(GzDecoder::new(file)).unpack(dest),
            Self::TarBz2 => Archive::new(BzDecoder::new(file)).unpack(dest),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::Format;
    use std::path::Path;

    #[test]
    fn detect_recognises_all_extensions() {
        let should_match = [
            "archive.zip",
            "archive.ZIP",
            "archive.tar",
            "archive.tar.gz",
            "archive.tgz",
            "archive.TGZ",
            "archive.tar.bz2",
            "archive.tbz",
            "archive.tbz2",
        ];
        for name in should_match {
            assert!(
                Format::detect(Path::new(name)).is_some(),
                "should match: {name}"
            );
        }

        let should_not_match = ["file.js", "info.csv", "photo.gz", "data.bz2"];
        for name in should_not_match {
            assert!(
                Format::detect(Path::new(name)).is_none(),
                "should not match: {name}"
            );
        }
    }

    #[test]
    fn detect_strips_correct_extension() {
        let cases = [
            ("dataset.tar.gz", "dataset"),
            ("dataset.tgz", "dataset"),
            ("dataset.tar.bz2", "dataset"),
            ("dataset.tbz", "dataset"),
            ("dataset.tbz2", "dataset"),
            ("dataset.zip", "dataset"),
            ("dataset.tar", "dataset"),
        ];
        for (filename, expected_name) in cases {
            let path = Path::new(filename);
            let (_, ext) =
                Format::detect(path).unwrap_or_else(|| panic!("no match for {filename}"));
            let raw = path.file_name().unwrap().to_string_lossy();
            assert_eq!(
                &raw[..raw.len() - ext.len()],
                expected_name,
                "failed for {filename}"
            );
        }
    }
}
