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
    let Some((format, name)) = detect_archive(path) else {
        return Ok(None);
    };
    let temp_dir = tempdir()?;
    format.extract(path, temp_dir.path())?;
    Ok(Some(ExtractionResult { name, temp_dir }))
}

/// Detects the archive format of `path` and its file name without the archive extension.
fn detect_archive(path: &Path) -> Option<(Format, String)> {
    let (format, ext) = Format::detect(path)?;
    let raw = path
        .file_name()
        .unwrap_or(path.as_os_str())
        .to_string_lossy();
    Some((format, raw[..raw.len() - ext.len()].to_owned()))
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
    use super::*;
    use rstest::rstest;

    #[rstest]
    #[case::zip("dataset.zip")]
    #[case::zip_uppercase("dataset.ZIP")]
    #[case::tar("dataset.tar")]
    #[case::tar_gz("dataset.tar.gz")]
    #[case::tgz("dataset.tgz")]
    #[case::tgz_uppercase("dataset.TGZ")]
    #[case::tar_bz2("dataset.tar.bz2")]
    #[case::tbz("dataset.tbz")]
    #[case::tbz2("dataset.tbz2")]
    fn detect_archive_strips_the_whole_extension(#[case] filename: &str) {
        let (_, name) = detect_archive(Path::new(filename)).unwrap();

        assert_eq!(name, "dataset");
    }

    #[rstest]
    #[case::js("file.js")]
    #[case::csv("info.csv")]
    #[case::gz("photo.gz")]
    #[case::bz2("data.bz2")]
    fn detect_ignores_other_extensions(#[case] filename: &str) {
        assert!(Format::detect(Path::new(filename)).is_none());
    }
}
