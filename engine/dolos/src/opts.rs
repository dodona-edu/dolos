use clap::{Args, Parser, Subcommand};
use std::path::PathBuf;
use tree_sitter_grammars::{Language, guess_grammar_from_name};

// ── Value parsers ────────────────────────────────────────────────────────────

fn parse_language(s: &str) -> Result<Language, String> {
    guess_grammar_from_name(s).ok_or_else(|| format!("unknown language: '{s}'"))
}

fn parse_percentage(s: &str) -> Result<f64, String> {
    let v: f64 = s
        .parse()
        .map_err(|_| format!("'{s}' is not a valid number"))?;
    if (0.0..=1.0).contains(&v) {
        Ok(v)
    } else {
        Err(format!("must be between 0 and 1 (got {v})"))
    }
}

fn parse_nonzero_usize(s: &str) -> Result<usize, String> {
    let v: usize = s
        .parse()
        .map_err(|_| format!("'{s}' is not a valid integer"))?;
    if v > 0 {
        Ok(v)
    } else {
        Err(format!("must be at least 1 (got {v})"))
    }
}

fn parse_nonzero_u16(s: &str) -> Result<u16, String> {
    let v: u16 = s
        .parse()
        .map_err(|_| format!("'{s}' is not a valid port number (1–65535)"))?;
    if v > 0 {
        Ok(v)
    } else {
        Err("port must be at least 1".to_string())
    }
}

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

/// Configuration for a Dolos analysis run.
///
/// Holds all analysis options and report-sort options.
/// Use [`DolosConfig::default()`] as a starting point and override fields as needed.
///
/// When using Dolos as a CLI, this struct is parsed directly from command-line arguments.
/// When using Dolos as a library, construct it with a struct literal or `Default`.
#[derive(Debug, Clone, Args)]
pub struct DolosConfig {
    #[arg(
        short = 'n',
        long,
        long_help = "Name of the analysis. Dolos tries to pick a sensible name from the input files if not given."
    )]
    pub name: Option<String>,

    #[arg(
        short = 'k',
        long,
        default_value = "23",
        value_parser = parse_nonzero_usize,
        long_help = "The length of each kgram fragment. Must be at least 1."
    )]
    pub kgram_length: usize,

    #[arg(
        short = 'w',
        long,
        default_value = "17",
        value_parser = parse_nonzero_usize,
        long_help = "The size of the window that will be used (in kgrams). Must be at least 1."
    )]
    pub kgrams_in_window: usize,

    #[arg(
        short = 'l',
        long,
        value_parser = parse_language,
        long_help = "Programming language used in the submitted files. Detected automatically if not given."
    )]
    pub language: Option<Language>,

    #[arg(
        short = 'm',
        long,
        value_parser = parse_nonzero_usize,
        long_help = "Maximum number of times a fingerprint may appear before it is ignored. \
                     A fingerprint appearing in many files is probably legitimate sharing, not plagiarism. \
                     The more restrictive rule between -m and -M takes precedence. Must be at least 1."
    )]
    pub max_fingerprint_count: Option<usize>,

    #[arg(
        short = 'M',
        long,
        value_parser = parse_percentage,
        long_help = "Maximum percentage of files a fingerprint may appear in before it is ignored (0–1). \
                     The more restrictive rule between -m and -M takes precedence."
    )]
    pub max_fingerprint_percentage: Option<f64>,

    #[arg(
        short = 'i',
        long,
        long_help = "Path of a file with template/boilerplate code. Fragments matching this file are ignored."
    )]
    pub ignore: Option<PathBuf>,

    #[arg(
        short = 'C',
        long,
        default_value = "false",
        long_help = "Include comments during tokenization."
    )]
    pub include_comments: bool,

    #[arg(
        short = 'c',
        long,
        long_help = "Keep matching fragments even when analysing more than two files."
    )]
    pub compare: bool,

    #[arg(
        short = 's',
        long,
        default_value = "1",
        value_parser = parse_nonzero_usize,
        long_help = "Minimum length (in fingerprints) a match must have to be registered. Must be at least 1."
    )]
    pub min_length_match: usize,

    #[arg(
        long,
        value_enum,
        long_help = "Sort pairs by: similarity, total-overlap, or longest-fragment."
    )]
    pub sort_by: Option<PairSortBy>,

    #[arg(
        short = 'b',
        long,
        value_enum,
        long_help = "Sort fragments within each pair by: kgrams-ascending, kgrams-descending, or file-order."
    )]
    pub fragment_sort_by: Option<FragmentSortBy>,
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

// ── OutputArgs ───────────────────────────────────────────────────────────────

#[derive(Debug, Clone, clap::ValueEnum, PartialEq)]
pub enum OutputFormat {
    Csv,
    Terminal,
    Console,
    Html,
    Web,
}

#[derive(Args, Debug)]
pub struct OutputConfig {
    #[arg(
        value_enum,
        short = 'f',
        long,
        default_value_t = OutputFormat::Terminal,
        long_help = "Output format: terminal/console, csv, html/web."
    )]
    pub output_format: OutputFormat,

    #[arg(
        short = 'o',
        long,
        default_value = ".",
        long_help = "Path where to write the output report to. Has no effect for terminal output."
    )]
    pub output_destination: PathBuf,

    #[arg(
        short = 'p',
        long,
        default_value = "3000",
        value_parser = parse_nonzero_u16,
        long_help = "Port for the web server. Must be between 1 and 65535."
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

// ── Top-level CLI ─────────────────────────────────────────────────────────────

#[derive(Parser, Debug)]
#[clap(author, version, about, long_about = None)]
pub struct Opts {
    #[clap(subcommand)]
    pub command: Command,
}

#[derive(Subcommand, Debug)]
pub enum Command {
    /// Run a similarity analysis on the given files.
    Run {
        /// Input file(s): source files, a CSV file, or an archive with a top-level info.csv.
        #[arg(required = true)]
        files: Vec<PathBuf>,

        #[clap(flatten)]
        config: DolosConfig,

        #[clap(flatten)]
        output_args: OutputConfig,
    },
}
