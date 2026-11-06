use std::path::PathBuf;
use tree_sitter_grammars::Language;
// ── Sort enums ───────────────────────────────────────────────────────────────

/// The order of the pairs in a [`Report`](crate::Report), from the highest to
/// the lowest value of a metric.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum PairSortBy {
    /// Sort by [`PairMetrics::similarity`](crate::PairMetrics::similarity).
    Similarity,
    /// Sort by the sum of both overlaps.
    TotalOverlap,
    /// Sort by [`PairMetrics::longest_match`](crate::PairMetrics::longest_match).
    LongestFragment,
}

/// The order of the fragments of a [`Pair`](crate::Pair).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum FragmentSortBy {
    /// From the fewest to the most fingerprints.
    KgramsAscending,
    /// From the most to the fewest fingerprints.
    KgramsDescending,
    /// By the start of the fragment in the left file.
    FileOrder,
}

// ── DolosConfig ──────────────────────────────────────────────────────────────

/// Validated configuration for a Dolos analysis run.
///
/// Construct via [`DolosConfig::builder()`] or [`DolosConfig::default()`].
///
/// # Examples
///
/// ```
/// use dolos::DolosConfig;
///
/// let config = DolosConfig::builder()
///     .kgram_length(23)
///     .max_fingerprint_percentage(0.8)
///     .build()?;
///
/// assert_ne!(config, DolosConfig::default());
/// # Ok::<(), std::io::Error>(())
/// ```
#[derive(Debug, Clone, PartialEq)]
pub struct DolosConfig {
    pub(crate) name: Option<String>,
    pub(crate) kgram_length: usize,
    pub(crate) kgrams_in_window: usize,
    pub(crate) language: Option<Language>,
    pub(crate) max_fingerprint_count: Option<usize>,
    pub(crate) max_fingerprint_percentage: Option<f64>,
    pub(crate) template: Vec<PathBuf>,
    pub(crate) include_comments: bool,
    pub(crate) compare: bool,
    pub(crate) include_analysis_data: bool,
    pub(crate) min_length_match: usize,
    pub(crate) sort_by: Option<PairSortBy>,
    pub(crate) fragment_sort_by: Option<FragmentSortBy>,
}

impl DolosConfig {
    /// Create a [`DolosConfigBuilder`] that holds the default values.
    ///
    /// The setters of [`DolosConfigBuilder`] list the defaults.
    ///
    /// # Examples
    ///
    /// ```
    /// use dolos::DolosConfig;
    ///
    /// let config = DolosConfig::builder().kgram_length(23).build()?;
    /// assert_eq!(config, DolosConfig::default());
    /// # Ok::<(), std::io::Error>(())
    /// ```
    pub fn builder() -> DolosConfigBuilder {
        DolosConfigBuilder::default()
    }

    /// The maximum number of files a fingerprint may appear in before it is
    /// ignored: the more restrictive of `max_fingerprint_count` and
    /// `max_fingerprint_percentage` over `file_count`, and never below 1.
    /// `None` when neither limit is set.
    pub(crate) fn max_fingerprint_file_count(&self, file_count: usize) -> Option<usize> {
        let from_percentage = self
            .max_fingerprint_percentage
            .map(|pct| (file_count as f64 * pct).round() as usize);
        [self.max_fingerprint_count, from_percentage]
            .into_iter()
            .flatten()
            .min()
            .map(|cap| cap.max(1))
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
            template: Vec::new(),
            include_comments: false,
            compare: false,
            include_analysis_data: false,
            min_length_match: 1,
            sort_by: None,
            fragment_sort_by: None,
        }
    }
}

// ── DolosConfigBuilder ───────────────────────────────────────────────────────

/// Builder for [`DolosConfig`]. Get one with [`DolosConfig::builder()`].
///
/// All values start at the defaults that the CLI uses.
///
/// # Examples
///
/// ```
/// use dolos::{DolosConfig, PairSortBy};
///
/// let config = DolosConfig::builder()
///     .kgram_length(25)
///     .kgrams_in_window(10)
///     .max_fingerprint_percentage(0.5)
///     .sort_by(PairSortBy::Similarity)
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

    /// Set the name of the report.
    ///
    /// # Parameters
    ///
    /// - `name`: the report name. Default: the name of the input. That is the
    ///   name of the input directory, the name of the directory that holds
    ///   the CSV file, or the archive without its extension. For separate
    ///   files, it is `a.js-b.js` for two files and `N files` otherwise.
    pub fn name(mut self, name: impl Into<String>) -> Self {
        self.config.name = Some(name.into());
        self
    }

    /// Set the length of a k-gram. Dolos hashes every k-gram of a file.
    ///
    /// # Parameters
    ///
    /// - `length`: the number of tokens in a k-gram. Default: 23.
    ///   [`build`](Self::build) fails when it is 0.
    pub fn kgram_length(mut self, length: usize) -> Self {
        self.config.kgram_length = length;
        self
    }

    /// Set the winnowing window size. Dolos keeps one fingerprint per window.
    ///
    /// # Parameters
    ///
    /// - `window`: the number of k-grams in a window. Default: 17.
    ///   [`build`](Self::build) fails when it is 0.
    pub fn kgrams_in_window(mut self, window: usize) -> Self {
        self.config.kgrams_in_window = window;
        self
    }

    /// Set the language of the files. [`Dolos::new`](crate::Dolos::new) skips
    /// the files of other languages.
    ///
    /// # Parameters
    ///
    /// - `language`: the language. Default: the language that most file
    ///   extensions belong to.
    pub fn language(mut self, language: Language) -> Self {
        self.config.language = Some(language);
        self
    }

    /// Ignore a fingerprint when it occurs in more than a number of files.
    ///
    /// With [`max_fingerprint_percentage`](Self::max_fingerprint_percentage),
    /// the lower limit applies.
    ///
    /// # Parameters
    ///
    /// - `count`: the maximum number of files. Default: no limit.
    ///   [`build`](Self::build) fails when it is 0.
    pub fn max_fingerprint_count(mut self, count: usize) -> Self {
        self.config.max_fingerprint_count = Some(count);
        self
    }

    /// Ignore a fingerprint when it occurs in more than a fraction of the files.
    ///
    /// The fraction is rounded to a number of files, and that number is at
    /// least 1. With [`max_fingerprint_count`](Self::max_fingerprint_count),
    /// the lower limit applies.
    ///
    /// # Parameters
    ///
    /// - `percentage`: the maximum fraction of the files. Default: no limit.
    ///   [`build`](Self::build) fails when it is not between 0 and 1.
    pub fn max_fingerprint_percentage(mut self, percentage: f64) -> Self {
        self.config.max_fingerprint_percentage = Some(percentage);
        self
    }

    /// Set the template. Dolos ignores every fingerprint of the template
    /// files in all files.
    ///
    /// # Parameters
    ///
    /// - `paths`: the template paths, in the forms of the `files` of
    ///   [`Dolos::new`](crate::Dolos::new). One regular file is also allowed.
    ///   Only the template files of the analysis language are used. Default: no
    ///   template. [`build`](Self::build) does not check the paths.
    ///   [`Dolos::new`](crate::Dolos::new) returns an error when it cannot read
    ///   them.
    pub fn template(mut self, paths: impl IntoIterator<Item = impl Into<PathBuf>>) -> Self {
        self.config.template = paths.into_iter().map(Into::into).collect();
        self
    }

    /// Set whether Dolos tokenizes the comments of the files.
    ///
    /// # Parameters
    ///
    /// - `include`: `true` to tokenize comments, `false` to skip them. Default:
    ///   `false`.
    pub fn include_comments(mut self, include: bool) -> Self {
        self.config.include_comments = include;
        self
    }

    /// Set whether Dolos computes the fragments of every pair.
    ///
    /// # Parameters
    ///
    /// - `compare`: `true` to always compute fragments. With `false`, Dolos
    ///   computes fragments only when there are exactly 2 files to analyze.
    ///   Default: `false`.
    pub fn compare(mut self, compare: bool) -> Self {
        self.config.compare = compare;
        self
    }

    /// Set whether the report holds the [`AnalysisData`](crate::AnalysisData)
    /// of every file.
    ///
    /// # Parameters
    ///
    /// - `include`: `true` to fill
    ///   [`File::analysis_data`](crate::File::analysis_data). Default: `false`.
    pub fn include_analysis_data(mut self, include: bool) -> Self {
        self.config.include_analysis_data = include;
        self
    }

    /// Set the minimum length of a match. Shorter matches do not count in the
    /// metrics.
    ///
    /// # Parameters
    ///
    /// - `length`: the minimum number of fingerprints in a match. Default: 1.
    ///   [`build`](Self::build) fails when it is 0.
    pub fn min_length_match(mut self, length: usize) -> Self {
        self.config.min_length_match = length;
        self
    }

    /// Set the order of the pairs in the report.
    ///
    /// # Parameters
    ///
    /// - `metric`: the metric to sort by. Default: the input order of the
    ///   files: `(0, 1)`, `(0, 2)`, ..., `(1, 2)`, ...
    pub fn sort_by(mut self, metric: PairSortBy) -> Self {
        self.config.sort_by = Some(metric);
        self
    }

    /// Set the order of the fragments of each pair.
    ///
    /// # Parameters
    ///
    /// - `order`: the fragment order. Default: [`FragmentSortBy::FileOrder`].
    pub fn fragment_sort_by(mut self, order: FragmentSortBy) -> Self {
        self.config.fragment_sort_by = Some(order);
        self
    }

    /// Check the values and build the [`DolosConfig`].
    ///
    /// # Errors
    ///
    /// Returns an [`InvalidInput`](std::io::ErrorKind::InvalidInput) error for
    /// the first rule that the values break:
    ///
    /// - [`kgram_length`](Self::kgram_length) is 0.
    /// - [`kgrams_in_window`](Self::kgrams_in_window) is 0.
    /// - [`min_length_match`](Self::min_length_match) is 0.
    /// - [`max_fingerprint_count`](Self::max_fingerprint_count) is set to 0.
    /// - [`max_fingerprint_percentage`](Self::max_fingerprint_percentage) is
    ///   set to a value outside 0 to 1, or to NaN.
    ///
    /// # Examples
    ///
    /// ```
    /// use dolos::DolosConfig;
    /// use std::io::ErrorKind;
    ///
    /// let result = DolosConfig::builder().max_fingerprint_percentage(1.5).build();
    /// assert_eq!(result.unwrap_err().kind(), ErrorKind::InvalidInput);
    /// ```
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

#[cfg(test)]
mod tests {
    use super::*;
    use rstest::rstest;

    #[rstest]
    #[case::zero_kgram_length(DolosConfig::builder().kgram_length(0))]
    #[case::zero_kgrams_in_window(DolosConfig::builder().kgrams_in_window(0))]
    #[case::zero_min_length_match(DolosConfig::builder().min_length_match(0))]
    #[case::zero_max_fingerprint_count(DolosConfig::builder().max_fingerprint_count(0))]
    #[case::percentage_above_one(DolosConfig::builder().max_fingerprint_percentage(1.5))]
    #[case::percentage_below_zero(DolosConfig::builder().max_fingerprint_percentage(-0.1))]
    fn build_rejects_out_of_range_values(#[case] builder: DolosConfigBuilder) {
        assert!(builder.build().is_err());
    }

    #[rstest]
    #[case::zero(0.0)]
    #[case::one(1.0)]
    fn build_accepts_boundary_percentages(#[case] percentage: f64) {
        assert!(
            DolosConfig::builder()
                .max_fingerprint_percentage(percentage)
                .build()
                .is_ok()
        );
    }

    #[test]
    fn percentage_cap_never_drops_below_one() {
        let config = DolosConfig::builder()
            .max_fingerprint_percentage(0.1)
            .build()
            .unwrap();

        assert_eq!(config.max_fingerprint_file_count(3), Some(1));
    }
}
