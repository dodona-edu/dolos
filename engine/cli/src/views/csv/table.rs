use std::io::{Error, Result};
use std::path::Path;

/// One column of a CSV table: the header name and how to read the value from a
/// row.
pub struct Column<T> {
    name: &'static str,
    value: fn(&T) -> String,
}

impl<T> Column<T> {
    pub const fn new(name: &'static str, value: fn(&T) -> String) -> Self {
        Self { name, value }
    }
}

/// Write `rows` to `path` as a CSV file with a header row.
pub fn write_table<'a, T: 'a>(
    path: &Path,
    columns: &[Column<T>],
    rows: impl IntoIterator<Item = &'a T>,
) -> Result<()> {
    let mut writer = csv::Writer::from_path(path).map_err(Error::other)?;
    writer
        .write_record(columns.iter().map(|c| c.name))
        .map_err(Error::other)?;
    for row in rows {
        writer
            .write_record(columns.iter().map(|c| (c.value)(row)))
            .map_err(Error::other)?;
    }
    writer.flush()
}
