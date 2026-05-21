use chrono::Utc;
use clap::{Parser, Subcommand};
use std::path::{Path, PathBuf};
use tree_sitter_grammars::{Language, guess_grammar_from_name, guess_grammar_from_path};

#[derive(Parser, Debug)]
#[clap(author, version, about, long_about = None)]
pub struct Opts {
    #[clap(subcommand)]
    pub command: Command,
}

#[derive(Debug, Clone, clap::ValueEnum, PartialEq)]
pub enum OutputFormat {
    Csv,
    Terminal,
    Console,
    Html,
    Web,
}

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

#[derive(Parser, Debug)]
pub struct IndexArgs {
    #[arg(
        short = 'k',
        long,
        default_value = "23",
        long_help = "The length of each kgram fragment."
    )]
    pub kgram_length: usize,

    #[arg(
        short = 'w',
        long,
        default_value = "17",
        long_help = "The size of the window that will be used (in kgrams)."
    )]
    pub kgrams_in_window: usize,

    #[arg(
        short = 'l',
        long,
        long_help = "Programming language used in the submitted files. Or 'char' to do a character by character comparison. Detect automatically if not given."
    )]
    pub language: Option<String>,

    #[arg(
        short = 'm',
        long,
        long_help = "The -m option sets the maximum number of times a given fingerprint may appear before it is ignored. A code fragment that appears in many programs is probably legitimate sharing and not the result of plagiarism. With -m N any fingerprint appearing in more than N programs is filtered out. The more restrictive rule between -m and -M takes precedence."
    )]
    pub max_fingerprint_count: Option<usize>,

    #[arg(
        short = 'M',
        long,
        long_help = "The -M option sets how many percent of the files the fingerprint may appear in before it is ignored. A fingerprint that appears in many programs is probably a legitimate fingerprint and not the result of plagiarism. With -M N any fingerprint appearing in more than N percent of the files is filtered out. Must be a value between 0 and 1. The more restrictive rule between -m and -M takes precedence."
    )]
    pub max_fingerprint_percentage: Option<f64>,

    #[arg(
        short = 'i',
        long,
        long_help = "Path of a file with template/boilerplate code. Code fragments matching with this file will be ignored."
    )]
    pub ignore: Option<PathBuf>,

    #[arg(
        short = 'C',
        long,
        default_value = "false",
        long_help = "Include the comments during the tokenization process."
    )]
    pub include_comments: bool,

    #[arg(
        short = 'c',
        long,
        long_help = "Keep the matching fragments even when analysing more than two files."
    )]
    pub compare: bool,

    #[arg(
        short = 's',
        long,
        default_value = "1",
        long_help = "The minimum length (in fingerprints) a match must have to be registered."
    )]
    pub min_length_match: usize,
}

#[derive(Parser, Debug)]
pub struct ReportArgs {
    #[arg(
        long,
        value_enum,
        long_help = "Which field to sort the pairs by. Options are: similarity, total overlap, and longest fragment."
    )]
    pub sort_by: Option<PairSortBy>,

    #[arg(
        short = 'b',
        long,
        value_enum,
        long_help = "How to sort the fragments by the amount of matches, only applicable in terminal comparison output. The options are: 'kgrams ascending', 'kgrams descending' and 'file order'."
    )]
    pub fragment_sort_by: Option<FragmentSortBy>,
}

#[derive(Parser, Debug)]
pub struct OutputArgs {
    #[arg(
        short = 'n',
        long,
        long_help = "Resulting name of the report. Dolos tries to pick a sensible name if not given."
    )]
    pub name: Option<String>,

    #[arg(value_enum, short = 'f', long, default_value_t = OutputFormat::Terminal, long_help = "Specifies what format the output should be in, current options are: terminal/console, csv, html/web.")]
    pub output_format: OutputFormat,

    #[arg(
        short = 'o',
        long,
        default_value = ".",
        long_help = "Path where to write the output report to. This has no effect when the output format is set to 'terminal'."
    )]
    pub output_destination: PathBuf,

    #[arg(
        short = 'p',
        long,
        default_value = "3000",
        long_help = "Port for the web server."
    )]
    pub port: u16,

    #[arg(
        short = 'H',
        long,
        default_value = "localhost",
        long_help = "Host for the web server."
    )]
    pub host: String,

    #[arg(
        long,
        default_value = "false",
        long_help = "Do not automatically open the browser for web output."
    )]
    pub no_open: bool,
}

#[derive(Parser, Debug)]
pub struct RunArgs {
    #[clap(flatten)]
    pub index_args: IndexArgs,
    #[clap(flatten)]
    pub report_args: ReportArgs,
    #[clap(flatten)]
    pub output_args: OutputArgs,
}

#[derive(Subcommand, Debug)]
pub enum Command {
    /// Run a similarity analysis on the given files.
    Run {
        /// Input file(s) for the analysis. Can be a list of source code files, a CSV-file, or a zip-file with a top level info.csv file.
        #[arg(required = true)]
        files: Vec<PathBuf>,

        #[clap(flatten)]
        run_args: RunArgs,
    },
}

// ---------------------------------------------------------------------------
// Resolved config structs — all fields that could be derived from the context are resolved.
// ---------------------------------------------------------------------------

/// Fully resolved index configuration produced from [`IndexArgs`] + file context.
pub struct IndexConfig {
    pub kgram_length: usize,
    pub kgrams_in_window: usize,
    pub language: Language,
    pub keep_fragments: bool,
    pub include_comments: bool,
    pub max_fingerprint_file_count: Option<usize>,
    pub ignore: Option<PathBuf>,
    pub min_length_match: usize,
}

/// Fully-resolved output configuration produced from [`OutputArgs`] + file context.
pub struct OutputConfig {
    /// Full report directory name: `dolos-report-{timestamp}-{base}`.
    pub name: String,
    pub output_format: OutputFormat,
    pub output_destination: PathBuf,
    pub port: u16,
    pub host: String,
    pub no_open: bool,
}

/// Resolved counterpart of [`ReportArgs`].
/// No context-dependent fields, but kept consistent with the other resolved structs.
pub struct ReportConfig {
    pub sort_by: Option<PairSortBy>,
    pub fragment_sort_by: Option<FragmentSortBy>,
}

/// Resolved counterpart of [`RunArgs`].
pub struct ResolvedRunArgs {
    pub index_config: IndexConfig,
    pub report_config: ReportConfig,
    pub output_config: OutputConfig,
}

// ---------------------------------------------------------------------------
// Resolution trait + impls
// ---------------------------------------------------------------------------

pub trait Resolve<T> {
    fn resolve(self, paths: &[PathBuf]) -> T;
}

impl Resolve<IndexConfig> for IndexArgs {
    fn resolve(self, paths: &[PathBuf]) -> IndexConfig {
        let language = match self.language.as_deref() {
            Some(s) => guess_grammar_from_name(s).expect("Unknown language"),
            None => {
                let first = paths.first().expect("no paths given");
                guess_grammar_from_path(first)
                    .expect("Could not detect language from file extension")
            }
        };

        let file_count = paths.len();
        // Compute both thresholds independently, then take the more restrictive
        // (lower) of the two.
        let from_count = self.max_fingerprint_count;
        let from_percentage = self
            .max_fingerprint_percentage
            .map(|pct| (file_count as f64 * pct).floor() as usize);

        let max_fingerprint_file_count = match (from_count, from_percentage) {
            (Some(a), Some(b)) => Some(a.min(b)),
            (Some(a), None) => Some(a),
            (None, Some(b)) => Some(b),
            (None, None) => None,
        };

        IndexConfig {
            kgram_length: self.kgram_length,
            kgrams_in_window: self.kgrams_in_window,
            keep_fragments: paths.len() == 2 || self.compare,
            language,
            include_comments: self.include_comments,
            max_fingerprint_file_count,
            ignore: self.ignore,
            min_length_match: self.min_length_match,
        }
    }
}

impl Resolve<OutputConfig> for OutputArgs {
    fn resolve(self, paths: &[PathBuf]) -> OutputConfig {
        let name = self.name.unwrap_or_else(|| derive_report_name(paths));

        OutputConfig {
            name,
            output_format: self.output_format,
            output_destination: self.output_destination,
            port: self.port,
            host: self.host,
            no_open: self.no_open,
        }
    }
}

impl Resolve<ReportConfig> for ReportArgs {
    fn resolve(self, _paths: &[PathBuf]) -> ReportConfig {
        ReportConfig {
            sort_by: self.sort_by,
            fragment_sort_by: self.fragment_sort_by,
        }
    }
}

impl Resolve<ResolvedRunArgs> for RunArgs {
    fn resolve(self, paths: &[PathBuf]) -> ResolvedRunArgs {
        ResolvedRunArgs {
            index_config: self.index_args.resolve(paths),
            report_config: self.report_args.resolve(paths),
            output_config: self.output_args.resolve(paths),
        }
    }
}

/// Derives the full report directory name from the file context.
///
/// Format: `dolos-report-{RFC3339_timestamp}-{base}`
///
/// Base name precedence:
/// - Single path → file stem (no extension)
/// - Two or more paths → `"{first_stem}--{second_stem}"`
/// - No paths → `"unknown"`
fn derive_report_name(paths: &[PathBuf]) -> String {
    let timestamp = Utc::now().format("%Y%m%dT%H%M%S%.3fZ").to_string();
    let base = match paths {
        [single] => file_stem(single),
        [first, second, ..] => format!("{}--{}", file_stem(first), file_stem(second)),
        _ => "unknown".to_string(),
    };
    format!("dolos-report-{timestamp}-{base}")
}

fn file_stem(path: &Path) -> String {
    path.file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("unknown")
        .to_string()
}
