//! JavaScript copies of the configuration and report types of `dolos-lib`,
//! with the conversions from and to the Rust types.
//!
//! napi-rs copies the doc comments into `index.d.ts`. They are written for
//! the TypeScript reader.

use napi::JsDate;
use napi::bindgen_prelude::{Env, Result, ToNapiValue, Unknown};
use napi_derive::napi;
use std::io;
use std::rc::Rc;

/// The options of an analysis. Every option is optional; a missing option
/// has the default of the CLI.
#[napi(object)]
#[derive(Debug, Clone, Default)]
pub struct DolosConfig {
    /// The name of the report. Default: the name of the input directory, CSV
    /// file or archive, or the names of the files.
    pub name: Option<String>,
    /// The number of tokens in a k-gram. Default: 23. At least 1.
    pub kgram_length: Option<u32>,
    /// The number of k-grams in a winnowing window. Default: 17. At least 1.
    pub kgrams_in_window: Option<u32>,
    /// The language of the files. The files of other languages are skipped.
    /// Default: the language that most file extensions belong to.
    pub language: Option<Language>,
    /// Ignore a fingerprint when it occurs in more than this number of files.
    /// Default: no limit. At least 1.
    pub max_fingerprint_count: Option<u32>,
    /// Ignore a fingerprint when it occurs in more than this fraction of the
    /// files. Default: no limit. Between 0 and 1.
    pub max_fingerprint_percentage: Option<f64>,
    /// The paths of the template, in the same forms as the input. Dolos
    /// ignores every fingerprint of the template. Default: no template.
    pub template: Option<Vec<String>>,
    /// Tokenize the comments of the files. Default: `false`.
    pub include_comments: Option<bool>,
    /// Compute the fragments of every pair. Without it, Dolos computes
    /// fragments only for exactly 2 files. Default: `false`.
    pub compare: Option<bool>,
    /// The minimum number of fingerprints in a match. Shorter matches do not
    /// count in the metrics. Default: 1. At least 1.
    pub min_length_match: Option<u32>,
    /// The order of the pairs in the report. Default: `PairSortBy.FileId`.
    pub sort_by: Option<PairSortBy>,
    /// The order of the fragments of each pair. Default: `FragmentSortBy.FileOrder`.
    pub fragment_sort_by: Option<FragmentSortBy>,
}

impl TryFrom<DolosConfig> for dolos::DolosConfig {
    type Error = io::Error;

    fn try_from(config: DolosConfig) -> io::Result<Self> {
        let mut builder = dolos::DolosConfig::builder();
        if let Some(name) = config.name {
            builder = builder.name(name);
        }
        if let Some(length) = config.kgram_length {
            builder = builder.kgram_length(length as usize);
        }
        if let Some(window) = config.kgrams_in_window {
            builder = builder.kgrams_in_window(window as usize);
        }
        if let Some(language) = config.language {
            builder = builder.language(language.into());
        }
        if let Some(count) = config.max_fingerprint_count {
            builder = builder.max_fingerprint_count(count as usize);
        }
        if let Some(percentage) = config.max_fingerprint_percentage {
            builder = builder.max_fingerprint_percentage(percentage);
        }
        if let Some(paths) = config.template {
            builder = builder.template(paths);
        }
        if let Some(include) = config.include_comments {
            builder = builder.include_comments(include);
        }
        if let Some(compare) = config.compare {
            builder = builder.compare(compare);
        }
        if let Some(length) = config.min_length_match {
            builder = builder.min_length_match(length as usize);
        }
        if let Some(order) = config.sort_by {
            builder = builder.sort_by(order.into());
        }
        if let Some(order) = config.fragment_sort_by {
            builder = builder.fragment_sort_by(order.into());
        }
        builder.build()
    }
}

/// The order of the pairs in a report.
#[napi(string_enum = "kebab-case")]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PairSortBy {
    /// By the id of the left file, then by the id of the right file.
    FileId,
    /// From the highest to the lowest similarity.
    Similarity,
    /// From the highest to the lowest sum of both overlaps.
    TotalOverlap,
    /// From the highest to the lowest longest match.
    LongestFragment,
}

impl From<PairSortBy> for dolos::PairSortBy {
    fn from(order: PairSortBy) -> Self {
        match order {
            PairSortBy::FileId => Self::FileId,
            PairSortBy::Similarity => Self::Similarity,
            PairSortBy::TotalOverlap => Self::TotalOverlap,
            PairSortBy::LongestFragment => Self::LongestFragment,
        }
    }
}

impl From<dolos::PairSortBy> for PairSortBy {
    fn from(order: dolos::PairSortBy) -> Self {
        match order {
            dolos::PairSortBy::FileId => Self::FileId,
            dolos::PairSortBy::Similarity => Self::Similarity,
            dolos::PairSortBy::TotalOverlap => Self::TotalOverlap,
            dolos::PairSortBy::LongestFragment => Self::LongestFragment,
        }
    }
}

/// The order of the fragments of a pair.
#[napi(string_enum = "kebab-case")]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FragmentSortBy {
    /// From the fewest to the most fingerprints, then in file order.
    KgramsAscending,
    /// From the most to the fewest fingerprints, then in file order.
    KgramsDescending,
    /// By the start of the fragment in the left file, then in the right file.
    FileOrder,
}

impl From<FragmentSortBy> for dolos::FragmentSortBy {
    fn from(order: FragmentSortBy) -> Self {
        match order {
            FragmentSortBy::KgramsAscending => Self::KgramsAscending,
            FragmentSortBy::KgramsDescending => Self::KgramsDescending,
            FragmentSortBy::FileOrder => Self::FileOrder,
        }
    }
}

impl From<dolos::FragmentSortBy> for FragmentSortBy {
    fn from(order: dolos::FragmentSortBy) -> Self {
        match order {
            dolos::FragmentSortBy::KgramsAscending => Self::KgramsAscending,
            dolos::FragmentSortBy::KgramsDescending => Self::KgramsDescending,
            dolos::FragmentSortBy::FileOrder => Self::FileOrder,
        }
    }
}

/// A supported language. `Char` is plain text: one token per character.
#[napi(string_enum = "lowercase")]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Language {
    Bash,
    C,
    Char,
    Cpp,
    CSharp,
    Dart,
    Elixir,
    Elm,
    Go,
    Groovy,
    Haskell,
    Java,
    Javascript,
    Julia,
    Kotlin,
    Lua,
    Modelica,
    Ocaml,
    Perl,
    Php,
    Python,
    R,
    Ruby,
    Rust,
    Scala,
    Sql,
    Swift,
    Typescript,
    Tsx,
    Verilog,
}

/// Map each variant of [`Language`] to the variant of [`dolos::Language`]
/// with the same name, in both directions.
macro_rules! convert_language {
    ($($variant:ident),* $(,)?) => {
        impl From<Language> for dolos::Language {
            fn from(language: Language) -> Self {
                match language {
                    $(Language::$variant => Self::$variant,)*
                }
            }
        }

        impl From<dolos::Language> for Language {
            fn from(language: dolos::Language) -> Self {
                match language {
                    $(dolos::Language::$variant => Self::$variant,)*
                }
            }
        }
    };
}

convert_language!(
    Bash, C, Char, Cpp, CSharp, Dart, Elixir, Elm, Go, Groovy, Haskell, Java, Javascript, Julia,
    Kotlin, Lua, Modelica, Ocaml, Perl, Php, Python, R, Ruby, Rust, Scala, Sql, Swift, Typescript,
    Tsx, Verilog,
);

/// The result of an analysis. Get one with `Dolos.buildReport`.
#[napi(object, object_from_js = false)]
pub struct Report<'env> {
    /// The options and the facts of the analysis.
    pub metadata: Metadata<'env>,
    /// The analyzed files, ordered by `id`.
    #[napi(ts_type = "Array<File>")]
    pub files: Vec<Unknown<'env>>,
    /// One pair for every two files, in the order of `metadata.sortBy`.
    pub pairs: Vec<Pair<'env>>,
}

/// The options and the facts of an analysis.
#[napi(object, object_from_js = false)]
pub struct Metadata<'env> {
    /// The name of the report.
    pub report_name: String,
    /// The time the analysis started.
    pub created_at: JsDate<'env>,
    /// The order of the pairs.
    pub sort_by: PairSortBy,
    /// The order of the fragments of each pair.
    pub fragment_sort_by: FragmentSortBy,
    /// The number of tokens in a k-gram.
    pub kgram_length: f64,
    /// The number of k-grams in a winnowing window.
    pub kgrams_in_window: f64,
    /// The language of the analyzed files.
    pub language: Language,
    /// Whether the comments were tokenized.
    pub include_comments: bool,
    /// Whether the pairs hold fragments.
    pub include_fragments: bool,
    /// The minimum number of fingerprints in a match.
    pub min_length_match: f64,
    /// The maximum number of files a fingerprint may occur in before it is
    /// ignored. Missing when there is no limit.
    pub max_fingerprint_file_count: Option<f64>,
    /// The template paths, as given.
    pub template: Vec<String>,
}

/// One input file of an analysis.
#[napi(object, object_from_js = false)]
#[derive(Debug, Clone)]
pub struct File {
    /// The zero-based index of the file in `report.files`.
    pub id: f64,
    /// The path of the file, relative to the input directory, the directory
    /// of the CSV file or the extracted archive. For separate input files,
    /// the path as given.
    pub relative_path: String,
    /// The full source text of the file.
    pub content: String,
    /// The other columns of the CSV row of the file, as `[column, value]`
    /// pairs in column order. Empty when the file has no CSV row.
    pub info: Vec<(String, String)>,
}

impl From<dolos::File> for File {
    fn from(file: dolos::File) -> Self {
        File {
            id: file.id as f64,
            relative_path: file.relative_path.display().to_string(),
            info: file
                .info
                .iter()
                .map(|(column, value)| (column.to_string(), value.to_string()))
                .collect(),
            content: file.content,
        }
    }
}

/// Two files of an analysis, with their metrics and fragments.
#[napi(object, object_from_js = false)]
pub struct Pair<'env> {
    /// The file with the lower id. The same object as in `report.files`.
    #[napi(ts_type = "File")]
    pub left_file: Unknown<'env>,
    /// The file with the higher id. The same object as in `report.files`.
    #[napi(ts_type = "File")]
    pub right_file: Unknown<'env>,
    /// The similarity metrics of the pair.
    pub metrics: PairMetrics,
    /// The shared fragments. Missing when `metadata.includeFragments` is
    /// `false`.
    pub fragments: Option<Vec<Fragment>>,
}

/// The similarity metrics of a pair. All counts are in fingerprints.
#[napi(object, object_from_js = false)]
#[derive(Debug, Clone)]
pub struct PairMetrics {
    /// The sum of both overlaps divided by the sum of both totals, between 0
    /// and 1. 0 when both totals are 0.
    pub similarity: f64,
    /// The number of fingerprints in the left file, without the ignored ones.
    pub total_left: f64,
    /// The number of fingerprints in the right file, without the ignored ones.
    pub total_right: f64,
    /// The number of fingerprints of the left file in at least one match.
    pub overlap_left: f64,
    /// The number of fingerprints of the right file in at least one match.
    pub overlap_right: f64,
    /// The length of the longest match. 0 when the pair has no match.
    pub longest_match: f64,
}

impl From<dolos::PairMetrics> for PairMetrics {
    fn from(metrics: dolos::PairMetrics) -> Self {
        PairMetrics {
            similarity: metrics.similarity,
            total_left: metrics.total_left as f64,
            total_right: metrics.total_right as f64,
            overlap_left: metrics.overlap_left as f64,
            overlap_right: metrics.overlap_right as f64,
            longest_match: metrics.longest_match as f64,
        }
    }
}

/// A part of the code that two files share.
#[napi(object, object_from_js = false)]
#[derive(Debug, Clone)]
pub struct Fragment {
    /// The region in the left file.
    pub left_region: Region,
    /// The region in the right file.
    pub right_region: Region,
    /// The number of shared fingerprints.
    pub fingerprint_count: f64,
}

impl From<dolos::Fragment> for Fragment {
    fn from(fragment: dolos::Fragment) -> Self {
        Fragment {
            left_region: fragment.left_region.into(),
            right_region: fragment.right_region.into(),
            fingerprint_count: fragment.fingerprint_count as f64,
        }
    }
}

/// A range of positions in a file, from `startPoint` up to but not including
/// `endPoint`.
#[napi(object, object_from_js = false)]
#[derive(Debug, Clone)]
pub struct Region {
    /// The first position in the region.
    pub start_point: Point,
    /// The first position after the region.
    pub end_point: Point,
}

impl From<dolos::Region> for Region {
    fn from(region: dolos::Region) -> Self {
        Region {
            start_point: region.start_point.into(),
            end_point: region.end_point.into(),
        }
    }
}

/// A position in a file.
#[napi(object, object_from_js = false)]
#[derive(Debug, Clone)]
pub struct Point {
    /// The zero-based line number.
    pub row: f64,
    /// The zero-based byte offset in the line.
    pub column: f64,
}

impl From<dolos::Point> for Point {
    fn from(point: dolos::Point) -> Self {
        Point { row: point.row as f64, column: point.column as f64 }
    }
}

/// A [`dolos::Report`] without `Rc`, so it can leave the thread pool. The
/// pairs refer to their files by index.
pub struct ReportData {
    metadata: dolos::Metadata,
    files: Vec<File>,
    pairs: Vec<PairData>,
}

struct PairData {
    left_file: usize,
    right_file: usize,
    metrics: PairMetrics,
    fragments: Option<Vec<Fragment>>,
}

impl From<dolos::Report> for ReportData {
    fn from(report: dolos::Report) -> Self {
        let pairs = report
            .pairs
            .into_iter()
            .map(|pair| PairData {
                left_file: pair.left_file.id,
                right_file: pair.right_file.id,
                metrics: pair.metrics.into(),
                fragments: pair
                    .fragments
                    .map(|fragments| fragments.into_iter().map(Fragment::from).collect()),
            })
            .collect();
        // The pairs no longer hold the files, so `unwrap_or_clone` does not clone.
        let files = report
            .files
            .into_iter()
            .map(|file| Rc::unwrap_or_clone(file).into())
            .collect();
        ReportData { metadata: report.metadata, files, pairs }
    }
}

impl ReportData {
    /// Convert to JavaScript values. Every pair refers to the file objects of
    /// `files`.
    pub fn into_js(self, env: &Env) -> Result<Report<'_>> {
        let files = self
            .files
            .into_iter()
            .map(|file| file.into_unknown(env))
            .collect::<Result<Vec<_>>>()?;
        let pairs = self
            .pairs
            .into_iter()
            .map(|pair| Pair {
                left_file: files[pair.left_file],
                right_file: files[pair.right_file],
                metrics: pair.metrics,
                fragments: pair.fragments,
            })
            .collect();
        Ok(Report { metadata: metadata(env, self.metadata)?, files, pairs })
    }
}

fn metadata(env: &Env, metadata: dolos::Metadata) -> Result<Metadata<'_>> {
    Ok(Metadata {
        report_name: metadata.report_name,
        created_at: env.create_date(metadata.created_at.as_millisecond() as f64)?,
        sort_by: metadata.sort_by.into(),
        fragment_sort_by: metadata.fragment_sort_by.into(),
        kgram_length: metadata.kgram_length as f64,
        kgrams_in_window: metadata.kgrams_in_window as f64,
        language: metadata.language.into(),
        include_comments: metadata.include_comments,
        include_fragments: metadata.include_fragments,
        min_length_match: metadata.min_length_match as f64,
        max_fingerprint_file_count: metadata
            .max_fingerprint_file_count
            .map(|count| count as f64),
        template: metadata
            .template
            .iter()
            .map(|path| path.display().to_string())
            .collect(),
    })
}
