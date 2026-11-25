use crate::winnowing::fingerprints::Fingerprint;
use crate::winnowing::region::Region;
use std::fmt;
use std::hash::{Hash, Hasher};
use std::iter::Zip;
use std::ops::Range;
use std::path::PathBuf;
use std::slice;
use std::sync::Arc;

/// One input file of an analysis.
#[derive(Clone)]
pub struct File {
    /// Zero-based index assigned in the order the file was added to the analysis.
    pub id: usize,
    /// The path of the file, relative to the input directory, the directory of
    /// the CSV file or the extracted archive. A path that does not start with
    /// that directory stays as it is, for example an absolute path in the
    /// `filename` column of a CSV file. For separate input files, the path as
    /// given.
    pub relative_path: PathBuf,
    /// Full source text of the file.
    pub content: String,
    /// The other columns of the CSV row of the file: the input CSV file or the
    /// `info.csv` of a directory. Empty when the file has no CSV row.
    pub info: FileInfo,
    /// The data needed to rerun the analysis for this file. `Some` only when
    /// [`include_analysis_data`](crate::DolosConfigBuilder::include_analysis_data)
    /// is set.
    pub analysis_data: Option<AnalysisData>,
}

/// The columns of the CSV row of a file, other than the `filename` column used
/// for the path, as uninterpreted strings in the column order of the CSV file.
/// Columns with the same name are all kept.
#[derive(Debug, Clone, Default, PartialEq, Eq, Hash)]
pub struct FileInfo {
    /// The column names. All rows of one CSV file share them.
    columns: Arc<[String]>,
    /// The value of each column, in the same order as `columns`.
    values: Vec<String>,
}

impl FileInfo {
    /// Create a `FileInfo` from `(column, value)` pairs, in the given order.
    ///
    /// # Parameters
    ///
    /// - `columns`: the `(column, value)` pairs.
    ///
    /// # Examples
    ///
    /// ```
    /// use dolos::FileInfo;
    ///
    /// let info = FileInfo::new(vec![("full_name".into(), "Ada Lovelace".into())]);
    /// assert_eq!(info.get("full_name"), Some("Ada Lovelace"));
    /// ```
    pub fn new(columns: Vec<(String, String)>) -> Self {
        columns.into_iter().collect()
    }

    /// Create a `FileInfo` from shared column names and the values of one row.
    pub(crate) fn from_row(columns: Arc<[String]>, values: Vec<String>) -> Self {
        debug_assert_eq!(columns.len(), values.len());
        Self { columns, values }
    }

    /// Return the value of the first column named `column`, or `None` when the
    /// row has no such column.
    ///
    /// # Parameters
    ///
    /// - `column`: the column name in the header of the CSV file.
    ///
    /// # Examples
    ///
    /// ```
    /// use dolos::FileInfo;
    ///
    /// let info = FileInfo::new(vec![("labels".into(), "group-1".into())]);
    /// assert_eq!(info.get("labels"), Some("group-1"));
    /// assert_eq!(info.get("full_name"), None);
    /// ```
    pub fn get(&self, column: &str) -> Option<&str> {
        self.iter()
            .find(|(name, _)| *name == column)
            .map(|(_, value)| value)
    }

    /// Return `true` when the row has no columns.
    ///
    /// # Examples
    ///
    /// ```
    /// use dolos::FileInfo;
    ///
    /// assert!(FileInfo::default().is_empty());
    /// let info = FileInfo::new(vec![("labels".into(), "group-1".into())]);
    /// assert!(!info.is_empty());
    /// ```
    pub fn is_empty(&self) -> bool {
        self.values.is_empty()
    }

    /// Return the `(column, value)` pairs in the column order of the CSV file.
    ///
    /// # Examples
    ///
    /// ```
    /// use dolos::FileInfo;
    ///
    /// let info = FileInfo::new(vec![
    ///     ("full_name".into(), "Ada Lovelace".into()),
    ///     ("labels".into(), "group-1".into()),
    /// ]);
    /// let columns: Vec<_> = info.iter().collect();
    /// assert_eq!(columns, [("full_name", "Ada Lovelace"), ("labels", "group-1")]);
    /// ```
    pub fn iter(&self) -> FileInfoIter<'_> {
        FileInfoIter { pairs: self.columns.iter().zip(&self.values) }
    }
}

/// Collects `(column, value)` pairs in the given order.
///
/// # Examples
///
/// ```
/// use dolos::FileInfo;
///
/// let info: FileInfo = [("labels".to_owned(), "group-1".to_owned())]
///     .into_iter()
///     .collect();
/// assert_eq!(info.get("labels"), Some("group-1"));
/// ```
impl FromIterator<(String, String)> for FileInfo {
    fn from_iter<I: IntoIterator<Item = (String, String)>>(pairs: I) -> Self {
        let (columns, values): (Vec<_>, Vec<_>) = pairs.into_iter().unzip();
        Self { columns: columns.into(), values }
    }
}

/// Iterates over the `(column, value)` pairs, as [`FileInfo::iter`] does.
///
/// # Examples
///
/// ```
/// use dolos::FileInfo;
///
/// let info = FileInfo::new(vec![("labels".into(), "group-1".into())]);
/// for (column, value) in &info {
///     assert_eq!((column, value), ("labels", "group-1"));
/// }
/// ```
impl<'a> IntoIterator for &'a FileInfo {
    type Item = (&'a str, &'a str);
    type IntoIter = FileInfoIter<'a>;

    fn into_iter(self) -> Self::IntoIter {
        self.iter()
    }
}

/// An iterator over the `(column, value)` pairs of a [`FileInfo`]. Get one with
/// [`FileInfo::iter`].
#[derive(Debug, Clone)]
pub struct FileInfoIter<'a> {
    pairs: Zip<slice::Iter<'a, String>, slice::Iter<'a, String>>,
}

impl<'a> Iterator for FileInfoIter<'a> {
    type Item = (&'a str, &'a str);

    fn next(&mut self) -> Option<Self::Item> {
        self.pairs
            .next()
            .map(|(column, value)| (column.as_str(), value.as_str()))
    }

    fn size_hint(&self) -> (usize, Option<usize>) {
        self.pairs.size_hint()
    }
}

impl ExactSizeIterator for FileInfoIter<'_> {}

/// Everything the analysis needs for one file. With it, a pair can be analysed
/// again from the report alone.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AnalysisData {
    /// The file's winnowed fingerprint sequence.
    pub fingerprints: Vec<Fingerprint>,
    /// The source region of each fingerprint (same length as `fingerprints`).
    pub regions: Vec<Region>,
    /// The ignored fingerprint positions, as half-open intervals.
    pub ignored: Vec<Range<usize>>,
}

impl Hash for File {
    fn hash<H>(&self, state: &mut H)
    where
        H: Hasher,
    {
        self.relative_path.hash(state);
    }
}

/// Compares the [`relative_path`](File::relative_path) of the files.
impl PartialEq for File {
    fn eq(&self, other: &Self) -> bool {
        self.relative_path == other.relative_path
    }
}

impl Eq for File {}

impl PartialOrd for File {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        Some(self.cmp(other))
    }
}

/// Orders the files by their [`relative_path`](File::relative_path).
impl Ord for File {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        self.relative_path.cmp(&other.relative_path)
    }
}

impl fmt::Debug for File {
    fn fmt(&self, fmt: &mut fmt::Formatter) -> fmt::Result {
        fmt.debug_struct("File")
            .field("path", &self.relative_path)
            .finish()
    }
}
