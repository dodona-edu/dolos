use dolos::Metadata;
use std::io::{Error, ErrorKind, Result};
use std::path::{Path, PathBuf};

/// A created, empty directory that holds the files of one report.
pub struct ReportDirectory {
    path: PathBuf,
}

impl ReportDirectory {
    /// Create the report directory.
    ///
    /// Uses `destination` when given, and an auto-named
    /// `dolos-report-<timestamp>-<name>` directory in the current directory
    /// otherwise.
    ///
    /// # Errors
    /// Returns [`ErrorKind::AlreadyExists`] when the directory already exists.
    pub fn create(destination: Option<PathBuf>, metadata: &Metadata) -> Result<Self> {
        let path = destination.unwrap_or_else(|| PathBuf::from(default_name(metadata)));
        if path.exists() {
            return Err(Error::new(
                ErrorKind::AlreadyExists,
                format!(
                    "Directory {} already exists. Please specify a different output destination.",
                    path.display()
                ),
            ));
        }
        std::fs::create_dir_all(&path)?;
        Ok(Self { path })
    }

    pub fn path(&self) -> &Path {
        &self.path
    }

    /// The full path of `file_name` inside this directory.
    pub fn file(&self, file_name: &str) -> PathBuf {
        self.path.join(file_name)
    }
}

/// Build the default directory name for a report.
fn default_name(metadata: &Metadata) -> String {
    format!(
        "dolos-report-{}-{}",
        metadata.created_at.format("%Y%m%dT%H%M%S%3fZ"),
        sanitize_name(&metadata.report_name),
    )
}

/// Sanitize a report name for use in a directory name: spaces become dashes and
/// any character that is not ASCII alphanumeric or `-` is dropped.
fn sanitize_name(name: &str) -> String {
    name.chars()
        .map(|c| if c == ' ' { '-' } else { c })
        .filter(|c| c.is_ascii_alphanumeric() || *c == '-')
        .collect()
}
