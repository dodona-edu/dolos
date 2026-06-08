use crate::file::FileSet;
use crate::opts::{DolosConfig, FragmentSortBy, PairSortBy};
use std::path::PathBuf;
use tree_sitter_grammars::{Language, guess_grammar_from_path};

/// Internal indexing configuration derived from [`DolosConfig`] and the dataset context.
pub struct IndexConfig {
    pub kgram_length: usize,
    pub kgrams_in_window: usize,
    /// The language to use for tokenization.
    pub language: Language,
    /// When `true` the user explicitly provided the language, so we do
    /// not enforce that file extensions match the language.
    pub language_user_specified: bool,
    pub keep_fragments: bool,
    pub include_comments: bool,
    pub max_fingerprint_file_count: Option<usize>,
    pub ignore: Option<PathBuf>,
    pub min_length_match: usize,
}

impl IndexConfig {
    /// Resolve the user-facing [`DolosConfig`] into the internal index config,
    /// using the dataset's file set for language detection and file-count limits.
    pub fn from_config(config: &DolosConfig, file_set: &FileSet) -> IndexConfig {
        let file_count = file_set.relative_paths.len();
        let (language, language_user_specified) = Self::resolve_language(config.language, file_set);
        let max_fingerprint_file_count = Self::resolve_max_fingerprint_count(config, file_count);
        let keep_fragments = file_count == 2 || config.compare;

        IndexConfig {
            kgram_length: config.kgram_length,
            kgrams_in_window: config.kgrams_in_window,
            language,
            language_user_specified,
            keep_fragments,
            include_comments: config.include_comments,
            max_fingerprint_file_count,
            ignore: config.ignore.clone(),
            min_length_match: config.min_length_match,
        }
    }

    /// Determine which language to use for tokenization.
    ///
    /// The user-supplied language wins; when absent, the language is guessed from
    /// the first file's extension. Also returns whether the user explicitly
    /// specified the language (which suppresses the extension-match check later).
    fn resolve_language(user_language: Option<Language>, file_set: &FileSet) -> (Language, bool) {
        if let Some(lang) = user_language {
            return (lang, true);
        }
        let first = file_set.relative_paths.first().expect("no paths given");
        let lang =
            guess_grammar_from_path(first).expect("Could not detect language from file extension");
        (lang, false)
    }

    /// Compute the maximum number of files a fingerprint may appear in before it
    /// is ignored, taking the more restrictive of the absolute count (`-m`) and
    /// the percentage-based limit (`-M`).
    fn resolve_max_fingerprint_count(config: &DolosConfig, file_count: usize) -> Option<usize> {
        let from_percentage = config
            .max_fingerprint_percentage
            .map(|pct| (file_count as f64 * pct).floor() as usize);
        [config.max_fingerprint_count, from_percentage]
            .into_iter()
            .flatten()
            .min()
    }
}

/// Report-presentation options derived from [`DolosConfig`].
pub struct ReportConfig {
    pub name: String,
    pub sort_by: Option<PairSortBy>,
    pub fragment_sort_by: Option<FragmentSortBy>,
}

impl ReportConfig {
    pub fn from_config(config: &DolosConfig, dataset_name: String) -> ReportConfig {
        ReportConfig {
            name: config.name.clone().unwrap_or(dataset_name),
            sort_by: config.sort_by.clone(),
            fragment_sort_by: config.fragment_sort_by.clone(),
        }
    }
}
