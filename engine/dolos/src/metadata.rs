use crate::config::{DolosConfig, FragmentSortBy, PairSortBy};
use crate::reader::Dataset;
use chrono::{DateTime, Utc};
use std::path::PathBuf;
use tree_sitter_grammars::Language;

/// The resolved configuration for one analysis run.
///
/// Derived from the raw [`DolosConfig`] plus the dataset context. Used by the
/// analysis algorithm and attached to every [`Report`] as its metadata record.
#[derive(Debug, Clone)]
pub struct Metadata {
    pub report_name: String,
    pub created_at: DateTime<Utc>,
    pub sort_by: Option<PairSortBy>,
    pub fragment_sort_by: Option<FragmentSortBy>,
    pub kgram_length: usize,
    pub kgrams_in_window: usize,
    /// The language used for tokenization.
    pub language: Language,
    /// `true` when the language was auto-detected from the file extension;
    /// `false` when the user specified it (in which case file extensions are
    /// not enforced to match).
    pub language_detected: bool,
    pub include_comments: bool,
    /// Whether per-pair code fragments were computed (`true` for exactly 2
    /// files or when `--compare` was passed).
    pub include_fragments: bool,
    pub min_length_match: usize,
    /// the maximum number of files a fingerprint may appear in before it is ignored,
    /// taking the more restrictive of the absolute count (`-m`) and percentage-based (`-M`) limits.
    pub max_fingerprint_file_count: Option<usize>,
    /// Path to the ignore / template file, if one was provided.
    pub ignore: Option<PathBuf>,
}

impl Metadata {
    /// Resolve the user-facing [`DolosConfig`] into the run metadata, using
    /// the dataset's file set for language detection and file-count limits.
    pub fn from_config(config: &DolosConfig, dataset: &Dataset) -> Metadata {
        let file_count = dataset.file_set.relative_paths.len();
        let (language, language_detected) = match config.language {
            // The user-supplied language wins; when absent, the language is
            // guessed from the first file's extension.
            Some(lang) => (lang, false),
            None => (
                dataset
                    .file_set
                    .detect_language()
                    .expect("Could not detect language from file extension"),
                true,
            ),
        };
        let max_fingerprint_file_count = config.max_fingerprint_file_count(file_count);

        Metadata {
            report_name: config.name.clone().unwrap_or_else(|| dataset.name.clone()),
            created_at: Utc::now(),
            sort_by: config.sort_by,
            fragment_sort_by: config.fragment_sort_by,
            kgram_length: config.kgram_length,
            kgrams_in_window: config.kgrams_in_window,
            language,
            language_detected,
            include_comments: config.include_comments,
            include_fragments: file_count == 2 || config.compare,
            min_length_match: config.min_length_match,
            max_fingerprint_file_count,
            ignore: config.ignore.clone(),
        }
    }

    /// The metadata fields as `(property, value)` pairs, in the order they are
    /// written to `metadata.csv`. Optional fields render as `"null"` when absent.
    #[rustfmt::skip]
    pub fn properties(&self) -> [(&'static str, String); 13] {
        [
            ("reportName", self.report_name.clone()),
            ("createdAt", self.created_at.to_rfc3339()),
            ("language", format!("{:?}", self.language)),
            ("languageDetected", self.language_detected.to_string()),
            ("kgramLength", self.kgram_length.to_string()),
            ("kgramsInWindow", self.kgrams_in_window.to_string()),
            ("minLengthMatch", self.min_length_match.to_string()),
            ("includeComments", self.include_comments.to_string()),
            ("includeFragments", self.include_fragments.to_string()),
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
