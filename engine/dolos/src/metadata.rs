use crate::config::{DolosConfig, FragmentSortBy, PairSortBy};
use crate::file::FileSet;
use crate::reader::Dataset;
use chrono::{DateTime, Utc};
use std::path::PathBuf;
use tree_sitter_grammars::{Language, guess_grammar_from_path};

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
        let (language, language_detected) =
            Self::resolve_language(config.language, &dataset.file_set);
        let max_fingerprint_file_count = Self::resolve_max_fingerprint_count(config, file_count);

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

    /// Determine which language to use for tokenization.
    ///
    /// The user-supplied language wins; when absent, the language is guessed
    /// from the first file's extension. Returns `(language, language_detected)`
    /// where `language_detected` is `true` when the language was auto-detected.
    fn resolve_language(user_language: Option<Language>, file_set: &FileSet) -> (Language, bool) {
        if let Some(lang) = user_language {
            return (lang, false);
        }
        let first = file_set.relative_paths.first().expect("no paths given");
        let lang =
            guess_grammar_from_path(first).expect("Could not detect language from file extension");
        (lang, true)
    }

    /// Compute the maximum number of files a fingerprint may appear in before
    /// it is ignored, taking the more restrictive of the absolute count (`-m`)
    /// and the percentage-based limit (`-M`).
    fn resolve_max_fingerprint_count(config: &DolosConfig, file_count: usize) -> Option<usize> {
        let from_percentage = config
            .max_fingerprint_percentage
            .map(|pct| (file_count as f64 * pct).round() as usize);
        [config.max_fingerprint_count, from_percentage]
            .into_iter()
            .flatten()
            .min()
    }
}
