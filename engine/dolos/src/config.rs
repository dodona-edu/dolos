use std::path::PathBuf;
use tree_sitter_grammars::Language;
// ── Sort enums ───────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Copy, clap::ValueEnum)]
pub enum PairSortBy {
    Similarity,
    TotalOverlap,
    LongestFragment,
}

#[derive(Debug, Clone, Copy, clap::ValueEnum)]
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
///     .kgram_length(23)
///     .max_fingerprint_percentage(0.8)
///     .build()?;
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
///     .kgram_length(50)
///     .build()?;
/// # Ok::<(), std::io::Error>(())
/// ```
#[derive(Debug, Clone, Default)]
pub struct DolosConfigBuilder {
    config: DolosConfig,
}

impl DolosConfigBuilder {
    fn validate(ok: bool, msg: String) -> std::io::Result<()> {
        ok.then_some(())
            .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::InvalidInput, msg))
    }

    fn require_nonzero(v: usize, field: &str) -> std::io::Result<()> {
        Self::validate(v != 0, format!("{field} must be at least 1"))
    }

    fn require_percentage(v: f64, field: &str) -> std::io::Result<()> {
        Self::validate(
            (0.0..=1.0).contains(&v),
            format!("{field} must be a decimal between 0 and 1 (got {v})"),
        )
    }

    pub fn name(mut self, v: impl Into<String>) -> Self {
        self.config.name = Some(v.into());
        self
    }

    pub fn kgram_length(mut self, v: usize) -> Self {
        self.config.kgram_length = v;
        self
    }

    pub fn kgrams_in_window(mut self, v: usize) -> Self {
        self.config.kgrams_in_window = v;
        self
    }

    pub fn language(mut self, v: Language) -> Self {
        self.config.language = Some(v);
        self
    }

    pub fn max_fingerprint_count(mut self, v: usize) -> Self {
        self.config.max_fingerprint_count = Some(v);
        self
    }

    pub fn max_fingerprint_percentage(mut self, v: f64) -> Self {
        self.config.max_fingerprint_percentage = Some(v);
        self
    }

    pub fn ignore(mut self, v: impl Into<PathBuf>) -> Self {
        self.config.ignore = Some(v.into());
        self
    }

    pub fn include_comments(mut self, v: bool) -> Self {
        self.config.include_comments = v;
        self
    }

    pub fn compare(mut self, v: bool) -> Self {
        self.config.compare = v;
        self
    }

    pub fn min_length_match(mut self, v: usize) -> Self {
        self.config.min_length_match = v;
        self
    }

    pub fn sort_by(mut self, v: PairSortBy) -> Self {
        self.config.sort_by = Some(v);
        self
    }

    pub fn fragment_sort_by(mut self, v: FragmentSortBy) -> Self {
        self.config.fragment_sort_by = Some(v);
        self
    }

    /// Validate and build a [`DolosConfig`] from the current builder state.
    pub fn build(self) -> std::io::Result<DolosConfig> {
        Self::require_nonzero(self.config.kgram_length, "kgram_length")?;
        Self::require_nonzero(self.config.kgrams_in_window, "kgrams_in_window")?;
        Self::require_nonzero(self.config.min_length_match, "min_length_match")?;
        if let Some(v) = self.config.max_fingerprint_count {
            Self::require_nonzero(v, "max_fingerprint_count")?;
        }
        if let Some(v) = self.config.max_fingerprint_percentage {
            Self::require_percentage(v, "max_fingerprint_percentage")?;
        }
        Ok(self.config)
    }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn zero_kgram_length_is_rejected() {
        assert!(DolosConfig::builder().kgram_length(0).build().is_err());
    }

    #[test]
    fn zero_kgrams_in_window_is_rejected() {
        assert!(DolosConfig::builder().kgrams_in_window(0).build().is_err());
    }

    #[test]
    fn zero_min_length_match_is_rejected() {
        assert!(DolosConfig::builder().min_length_match(0).build().is_err());
    }

    #[test]
    fn zero_max_fingerprint_count_is_rejected() {
        assert!(
            DolosConfig::builder()
                .max_fingerprint_count(0)
                .build()
                .is_err()
        );
    }

    #[test]
    fn out_of_range_percentage_is_rejected() {
        assert!(
            DolosConfig::builder()
                .max_fingerprint_percentage(1.5)
                .build()
                .is_err()
        );
        assert!(
            DolosConfig::builder()
                .max_fingerprint_percentage(-0.1)
                .build()
                .is_err()
        );
    }

    #[test]
    fn boundary_percentages_are_accepted() {
        assert!(
            DolosConfig::builder()
                .max_fingerprint_percentage(0.0)
                .build()
                .is_ok()
        );
        assert!(
            DolosConfig::builder()
                .max_fingerprint_percentage(1.0)
                .build()
                .is_ok()
        );
    }
}
