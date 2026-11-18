use crate::views::csv::report_dir::ReportDirectory;
use crate::views::csv::rows::{FileRow, FragmentRow, MetadataRow, PairRow};
use crate::views::view::View;
use anyhow::{Context, Result};
use dolos::{Pair, Report};
use serde::Serialize;
use std::path::{Path, PathBuf};

/// Writes the report as a set of CSV files in one directory.
pub struct CsvView {
    destination: Option<PathBuf>,
}

impl CsvView {
    pub fn new(destination: Option<PathBuf>) -> Self {
        Self { destination }
    }

    /// Write the report and return the directory it was written to.
    ///
    /// Writes `metadata.csv`, `files.csv` and `pairs.csv`, and `fragments.csv` (if the report tracks the fragments).
    pub fn write(&self, report: &Report) -> Result<ReportDirectory> {
        let dir = ReportDirectory::create(self.destination.clone(), &report.metadata)?;

        let properties = report.metadata.properties();
        let metadata = properties
            .iter()
            .map(|(property, value)| MetadataRow::new(property, value));
        write_table(&dir.file("metadata.csv"), &MetadataRow::HEADER, metadata)?;

        let files = report.files.iter().map(|file| FileRow::new(file));
        write_table(&dir.file("files.csv"), &FileRow::HEADER, files)?;

        let file_count = report.files.len();
        let pairs = report
            .pairs
            .iter()
            .map(|pair| PairRow::new(pair_id(pair, file_count), pair));
        write_table(&dir.file("pairs.csv"), &PairRow::HEADER, pairs)?;

        if report.metadata.include_fragments {
            let fragments = report.pairs.iter().flat_map(|pair| {
                pair.fragments
                    .iter()
                    .flatten()
                    .map(move |fragment| FragmentRow::new(pair, fragment))
            });

            write_table(&dir.file("fragments.csv"), &FragmentRow::HEADER, fragments)?;
        }

        Ok(dir)
    }
}

impl View for CsvView {
    fn show(&self, report: &Report) -> Result<()> {
        self.write(report)?;
        Ok(())
    }
}

/// The index of `pair` in the order (0,1), (0,2), ..., (0,n-1), (1,2), ... of its file ids.
///
/// This is the order of `--sort-by file-id`.
/// `file_count` is the number of files in the report.
fn pair_id(pair: &Pair, file_count: usize) -> usize {
    let (left, right) = (pair.left_file.id, pair.right_file.id);
    left * (2 * file_count - left - 1) / 2 + (right - left - 1)
}

/// Write `rows` to `path` as a CSV file with `header` as its first row.
fn write_table<R: Serialize>(
    path: &Path,
    header: &[&str],
    rows: impl IntoIterator<Item = R>,
) -> Result<()> {
    let mut writer = csv::WriterBuilder::new()
        .has_headers(false)
        .from_path(path)
        .with_context(|| format!("could not create '{}'", path.display()))?;
    writer.write_record(header)?;
    for row in rows {
        writer.serialize(row)?;
    }
    writer.flush()?;
    Ok(())
}
