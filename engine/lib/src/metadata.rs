use crate::config::{DolosConfig, FragmentSortBy, PairSortBy};
use crate::reader::Dataset;
use chrono::{DateTime, Utc};
use dolos_core::AnalysisOptions;
use std::path::PathBuf;
use tree_sitter_grammars::Language;

/// The settings of one analysis run, as [`Report::metadata`](crate::Report::metadata).
///
/// It holds the values of the [`DolosConfig`], completed with the values that
/// Dolos derives from the input.
#[derive(Debug, Clone, PartialEq)]
pub struct Metadata {
    /// The configured name, or the name of the input.
    pub report_name: String,
    /// The time at which [`Dolos::new`](crate::Dolos::new) ran.
    pub created_at: DateTime<Utc>,
    pub sort_by: Option<PairSortBy>,
    pub fragment_sort_by: Option<FragmentSortBy>,
    /// The number of tokens in a k-gram.
    pub kgram_length: usize,
    /// The winnowing window size, in k-grams.
    pub kgrams_in_window: usize,
    /// The configured or the detected language of the files.
    pub language: Language,
    pub include_comments: bool,
    /// Whether the pairs carry fragments. `true` when there are exactly 2
    /// files to analyze or when
    /// [`compare`](crate::DolosConfigBuilder::compare) is `true`.
    pub include_fragments: bool,
    /// Whether every file holds its [`AnalysisData`](crate::AnalysisData).
    pub include_analysis_data: bool,
    /// The minimum length of a match, in fingerprints.
    pub min_length_match: usize,
    /// The maximum number of files a fingerprint may occur in before Dolos
    /// ignores it: the lower of the count and the percentage limit, and at
    /// least 1. `None` when neither limit is set.
    pub max_fingerprint_file_count: Option<usize>,
    /// Path to the ignore / template file, if one was provided.
    pub ignore: Option<PathBuf>,
}

impl Metadata {
    /// Resolve the user-facing [`DolosConfig`] and the [`Dataset`] into the run metadata.
    pub(crate) fn from_config(config: &DolosConfig, dataset: &Dataset) -> Metadata {
        let file_count = dataset.file_set.relative_paths.len();
        let max_fingerprint_file_count = config.max_fingerprint_file_count(file_count);

        Metadata {
            report_name: config.name.clone().unwrap_or_else(|| dataset.name.clone()),
            created_at: Utc::now(),
            sort_by: config.sort_by,
            fragment_sort_by: config.fragment_sort_by,
            kgram_length: config.kgram_length,
            kgrams_in_window: config.kgrams_in_window,
            language: dataset.language,
            include_comments: config.include_comments,
            include_fragments: file_count == 2 || config.compare,
            include_analysis_data: config.include_analysis_data,
            min_length_match: config.min_length_match,
            max_fingerprint_file_count,
            ignore: config.ignore.clone(),
        }
    }

    /// The analysis options this run uses.
    pub(crate) fn analysis_options(&self) -> AnalysisOptions {
        AnalysisOptions {
            min_match_length: self.min_length_match,
            keep_matches: self.include_fragments,
        }
    }

    /// Return the metadata as `(property, value)` pairs, in the order of
    /// `metadata.csv`.
    ///
    /// The property names are in camelCase. An absent optional value is
    /// `"null"`.
    ///
    /// # Examples
    ///
    /// ```
    /// # #[cfg(feature = "lang-javascript")]
    /// # fn main() -> std::io::Result<()> {
    /// # use dolos::{Dolos, DolosConfig};
    /// # use std::path::Path;
    /// # let fixtures = Path::new(env!("CARGO_MANIFEST_DIR")).join("fixtures");
    /// # let files = vec![fixtures.join("sample1.js"), fixtures.join("sample2.js")];
    /// let report = Dolos::new(files, DolosConfig::default())?.build_report();
    ///
    /// let properties = report.metadata.properties();
    /// assert_eq!(properties[0], ("reportName", "sample1.js-sample2.js".to_string()));
    /// # Ok(())
    /// # }
    /// # #[cfg(not(feature = "lang-javascript"))]
    /// # fn main() {}
    /// ```
    #[rustfmt::skip]
    pub fn properties(&self) -> [(&'static str, String); 13] {
        [
            ("reportName", self.report_name.clone()),
            ("createdAt", self.created_at.to_rfc3339()),
            ("language", format!("{:?}", self.language)),
            ("kgramLength", self.kgram_length.to_string()),
            ("kgramsInWindow", self.kgrams_in_window.to_string()),
            ("minLengthMatch", self.min_length_match.to_string()),
            ("includeComments", self.include_comments.to_string()),
            ("includeFragments", self.include_fragments.to_string()),
            ("includeAnalysisData", self.include_analysis_data.to_string()),
            ("maxFingerprintFileCount", optional(self.max_fingerprint_file_count.map(|v| v.to_string()))),
            ("sortBy", optional(self.sort_by.map(|s| format!("{s:?}")))),
            ("fragmentSortBy", optional(self.fragment_sort_by.map(|s| format!("{s:?}")))),
            ("ignore", optional(self.ignore.as_ref().map(|p| p.display().to_string()))),
        ]
    }
}

/// Render an optional metadata field, returning `"null"` when absent.
fn optional(value: Option<String>) -> String {
    value.unwrap_or_else(|| "null".to_string())
}
