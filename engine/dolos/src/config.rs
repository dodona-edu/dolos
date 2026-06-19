use crate::file::FileSet;
use std::path::PathBuf;
use tree_sitter_grammars::{Language, guess_grammar_from_path};

// ── Sort enums ───────────────────────────────────────────────────────────────

#[derive(Debug, Clone, clap::ValueEnum)]
pub enum PairSortBy {
    Similarity,
    TotalOverlap,
    LongestFragment,
}

#[derive(Debug, Clone, clap::ValueEnum)]
pub enum FragmentSortBy {
    KgramsAscending,
    KgramsDescending,
    FileOrder,
}

// ── DolosConfig ──────────────────────────────────────────────────────────────

/// Validated configuration for a Dolos analysis run.
///
/// Construct via [`DolosConfig::builder()`] or [`DolosConfig::default()`].
/// A `DolosConfig` value is always valid — construction fails rather than
/// producing a config with out-of-range fields.
///
/// # Example
/// ```no_run
/// use dolos::config::DolosConfig;
///
/// let config = DolosConfig::builder()
///     .kgram_length(23)?
///     .max_fingerprint_percentage(0.8)?
///     .build();
/// # Ok::<(), std::io::Error>(())
/// ```
#[derive(Debug, Clone)]
pub struct DolosConfig {
    pub name: Option<String>,
    pub kgram_length: usize,
    pub kgrams_in_window: usize,
    pub language: Option<Language>,
    pub max_fingerprint_count: Option<usize>,
    pub max_fingerprint_percentage: Option<f64>,
    pub ignore: Option<PathBuf>,
    pub include_comments: bool,
    pub compare: bool,
    pub min_length_match: usize,
    pub sort_by: Option<PairSortBy>,
    pub fragment_sort_by: Option<FragmentSortBy>,
}

impl DolosConfig {
    /// Create a [`DolosConfigBuilder`] pre-filled with the default values.
    pub fn builder() -> DolosConfigBuilder {
        DolosConfigBuilder::default()
    }
}

impl Default for DolosConfig {
    fn default() -> Self {
        DolosConfigBuilder::default().build()
    }
}

// ── DolosConfigBuilder ───────────────────────────────────────────────────────

/// Builder for [`DolosConfig`]. Get one via [`DolosConfig::builder()`].
///
/// All fields start at the same defaults that the CLI uses. Override only what
/// you need, then call [`build`](DolosConfigBuilder::build) to validate and
/// produce a [`DolosConfig`].
///
/// # Example
/// ```no_run
/// use dolos::config::DolosConfig;
///
/// let config = DolosConfig::builder()
///     .kgram_length(50)?
///     .build();
/// # Ok::<(), std::io::Error>(())
/// ```
#[derive(Debug, Clone)]
pub struct DolosConfigBuilder {
    name: Option<String>,
    kgram_length: usize,
    kgrams_in_window: usize,
    language: Option<Language>,
    max_fingerprint_count: Option<usize>,
    max_fingerprint_percentage: Option<f64>,
    ignore: Option<PathBuf>,
    include_comments: bool,
    compare: bool,
    min_length_match: usize,
    sort_by: Option<PairSortBy>,
    fragment_sort_by: Option<FragmentSortBy>,
}

impl Default for DolosConfigBuilder {
    fn default() -> Self {
        Self {
            name: None,
            kgram_length: 23,
            kgrams_in_window: 17,
            language: None,
            max_fingerprint_count: None,
            max_fingerprint_percentage: None,
            ignore: None,
            include_comments: false,
            compare: false,
            min_length_match: 1,
            sort_by: None,
            fragment_sort_by: None,
        }
    }
}

impl DolosConfigBuilder {
    fn require_nonzero(v: usize, field: &str) -> std::io::Result<usize> {
        (v != 0).then_some(v).ok_or_else(|| {
            std::io::Error::new(
                std::io::ErrorKind::InvalidInput,
                format!("{field} must be at least 1"),
            )
        })
    }

    fn require_percentage(v: f64, field: &str) -> std::io::Result<f64> {
        (0.0..=1.0).contains(&v).then_some(v).ok_or_else(|| {
            std::io::Error::new(
                std::io::ErrorKind::InvalidInput,
                format!("{field} must be a decimal between 0 and 1 (got {v})"),
            )
        })
    }
    pub fn name(mut self, v: impl Into<String>) -> Self {
        self.name = Some(v.into());
        self
    }

    pub fn kgram_length(mut self, v: usize) -> std::io::Result<Self> {
        self.kgram_length = Self::require_nonzero(v, "kgram_length")?;
        Ok(self)
    }

    pub fn kgrams_in_window(mut self, v: usize) -> std::io::Result<Self> {
        self.kgrams_in_window = Self::require_nonzero(v, "kgrams_in_window")?;
        Ok(self)
    }

    pub fn language(mut self, v: Language) -> Self {
        self.language = Some(v);
        self
    }

    pub fn max_fingerprint_count(mut self, v: usize) -> std::io::Result<Self> {
        self.max_fingerprint_count = Some(Self::require_nonzero(v, "max_fingerprint_count")?);
        Ok(self)
    }

    pub fn max_fingerprint_percentage(mut self, v: f64) -> std::io::Result<Self> {
        self.max_fingerprint_percentage =
            Some(Self::require_percentage(v, "max_fingerprint_percentage")?);
        Ok(self)
    }

    pub fn ignore(mut self, v: impl Into<PathBuf>) -> Self {
        self.ignore = Some(v.into());
        self
    }

    pub fn include_comments(mut self, v: bool) -> Self {
        self.include_comments = v;
        self
    }

    pub fn compare(mut self, v: bool) -> Self {
        self.compare = v;
        self
    }

    pub fn min_length_match(mut self, v: usize) -> std::io::Result<Self> {
        self.min_length_match = Self::require_nonzero(v, "min_length_match")?;
        Ok(self)
    }

    pub fn sort_by(mut self, v: PairSortBy) -> Self {
        self.sort_by = Some(v);
        self
    }

    pub fn fragment_sort_by(mut self, v: FragmentSortBy) -> Self {
        self.fragment_sort_by = Some(v);
        self
    }

    /// Build a [`DolosConfig`] from the current builder state.
    ///
    /// Infallible — all validation happened in the individual setters.
    pub fn build(self) -> DolosConfig {
        DolosConfig {
            name: self.name,
            kgram_length: self.kgram_length,
            kgrams_in_window: self.kgrams_in_window,
            language: self.language,
            max_fingerprint_count: self.max_fingerprint_count,
            max_fingerprint_percentage: self.max_fingerprint_percentage,
            ignore: self.ignore,
            include_comments: self.include_comments,
            compare: self.compare,
            min_length_match: self.min_length_match,
            sort_by: self.sort_by,
            fragment_sort_by: self.fragment_sort_by,
        }
    }
}

// ── Internal IndexConfig ─────────────────────────────────────────────────────

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
            .map(|pct| (file_count as f64 * pct).ceil() as usize);
        [config.max_fingerprint_count, from_percentage]
            .into_iter()
            .flatten()
            .min()
    }
}

// ── Internal ReportConfig ─────────────────────────────────────────────────────

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

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_config_is_valid() {
        let _ = DolosConfig::builder().build();
        let _ = DolosConfig::default();
    }

    #[test]
    fn zero_kgram_length_is_rejected() {
        assert!(DolosConfig::builder().kgram_length(0).is_err());
    }

    #[test]
    fn zero_kgrams_in_window_is_rejected() {
        assert!(DolosConfig::builder().kgrams_in_window(0).is_err());
    }

    #[test]
    fn zero_min_length_match_is_rejected() {
        assert!(DolosConfig::builder().min_length_match(0).is_err());
    }

    #[test]
    fn zero_max_fingerprint_count_is_rejected() {
        assert!(DolosConfig::builder().max_fingerprint_count(0).is_err());
    }

    #[test]
    fn out_of_range_percentage_is_rejected() {
        assert!(
            DolosConfig::builder()
                .max_fingerprint_percentage(1.5)
                .is_err()
        );
        assert!(
            DolosConfig::builder()
                .max_fingerprint_percentage(-0.1)
                .is_err()
        );
    }

    #[test]
    fn boundary_percentages_are_accepted() {
        assert!(
            DolosConfig::builder()
                .max_fingerprint_percentage(0.0)
                .is_ok()
        );
        assert!(
            DolosConfig::builder()
                .max_fingerprint_percentage(1.0)
                .is_ok()
        );
    }
}
