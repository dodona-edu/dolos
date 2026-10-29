use clap::{Args, Parser, Subcommand};
use dolos::{DolosConfig, FragmentSortBy, PairSortBy};
use std::path::PathBuf;
use tree_sitter_grammars::Language;

fn parse_language(s: &str) -> Result<Language, String> {
    Language::from_name(s).ok_or_else(|| format!("unknown language: '{s}'"))
}

#[derive(Debug, Clone, Copy, clap::ValueEnum)]
pub enum CliPairSortBy {
    Similarity,
    TotalOverlap,
    LongestFragment,
}

impl From<CliPairSortBy> for PairSortBy {
    fn from(v: CliPairSortBy) -> Self {
        match v {
            CliPairSortBy::Similarity => PairSortBy::Similarity,
            CliPairSortBy::TotalOverlap => PairSortBy::TotalOverlap,
            CliPairSortBy::LongestFragment => PairSortBy::LongestFragment,
        }
    }
}

#[derive(Debug, Clone, Copy, clap::ValueEnum)]
pub enum CliFragmentSortBy {
    KgramsAscending,
    KgramsDescending,
    FileOrder,
}

impl From<CliFragmentSortBy> for FragmentSortBy {
    fn from(v: CliFragmentSortBy) -> Self {
        match v {
            CliFragmentSortBy::KgramsAscending => FragmentSortBy::KgramsAscending,
            CliFragmentSortBy::KgramsDescending => FragmentSortBy::KgramsDescending,
            CliFragmentSortBy::FileOrder => FragmentSortBy::FileOrder,
        }
    }
}

/// Raw CLI arguments for a Dolos analysis run.
///
/// Clap parses this struct directly from command-line arguments. To use
/// Dolos as a library, use [`DolosConfig::builder()`] instead.
#[derive(Debug, Clone, Args)]
pub struct DolosArgs {
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
        long_help = "The length of each kgram fragment. Must be at least 1."
    )]
    pub kgram_length: usize,

    #[arg(
        short = 'w',
        long,
        default_value = "17",
        long_help = "The size of the window that will be used (in kgrams). Must be at least 1."
    )]
    pub kgrams_in_window: usize,

    #[arg(
        short = 'l',
        long,
        value_parser = parse_language,
        long_help = "Programming language used in the submitted files. Detected automatically if not given. \
                     Files without a matching extension are skipped."
    )]
    pub language: Option<Language>,

    #[arg(
        short = 'm',
        long,
        long_help = "Maximum number of files a fingerprint may appear before it is ignored. \
                     A fingerprint appearing in many files is probably legitimate sharing, not plagiarism. \
                     The more restrictive rule between -m and -M takes precedence. Must be at least 1."
    )]
    pub max_fingerprint_count: Option<usize>,

    #[arg(
        short = 'M',
        long,
        long_help = "Maximum percentage of files a fingerprint may appear in before it is ignored (0–1), \
                     rounded to the nearest integer. The more restrictive rule between -m and -M takes precedence. \
                     A limit resolving to less than one file is raised to one."
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
        default_value = "false",
        long_help = "Keep matching fragments even when analysing more than two files."
    )]
    pub compare: bool,

    #[arg(
        short = 's',
        long,
        default_value = "1",
        long_help = "Minimum length (in fingerprints) a match must have to be registered. Must be at least 1."
    )]
    pub min_length_match: usize,

    #[arg(
        long,
        default_value = "false",
        long_help = "Include each file's fingerprints, their source locations and its ignored \
                     positions in the report. This data is required to rerun only the analysis \
                     with dolos-core, without parsing and fingerprinting the source files again."
    )]
    pub include_analysis_data: bool,

    #[arg(
        value_enum,
        long,
        long_help = "Sort pairs by: similarity, total-overlap, or longest-fragment."
    )]
    pub sort_by: Option<CliPairSortBy>,

    #[arg(
        value_enum,
        short = 'b',
        long,
        long_help = "Sort fragments within each pair by: kgrams-ascending, kgrams-descending, or file-order."
    )]
    pub fragment_sort_by: Option<CliFragmentSortBy>,
}

impl TryFrom<DolosArgs> for DolosConfig {
    type Error = std::io::Error;

    fn try_from(a: DolosArgs) -> std::io::Result<Self> {
        let mut b = DolosConfig::builder()
            .kgram_length(a.kgram_length)
            .kgrams_in_window(a.kgrams_in_window)
            .include_comments(a.include_comments)
            .compare(a.compare)
            .include_analysis_data(a.include_analysis_data)
            .min_length_match(a.min_length_match);

        if let Some(v) = a.name {
            b = b.name(v);
        }
        if let Some(v) = a.language {
            b = b.language(v);
        }
        if let Some(v) = a.max_fingerprint_count {
            b = b.max_fingerprint_count(v);
        }
        if let Some(v) = a.max_fingerprint_percentage {
            b = b.max_fingerprint_percentage(v);
        }
        if let Some(v) = a.ignore {
            b = b.ignore(v);
        }
        if let Some(v) = a.sort_by {
            b = b.sort_by(v.into());
        }
        if let Some(v) = a.fragment_sort_by {
            b = b.fragment_sort_by(v.into());
        }

        b.build()
    }
}

#[derive(Debug, Clone, clap::ValueEnum, PartialEq)]
pub enum OutputFormat {
    Csv,
    Terminal,
    Console,
    Html,
    Web,
}

#[derive(Args, Debug)]
pub struct OutputArgs {
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
        long_help = "Directory to write the report into. The CSV files are written directly here. \
                     Errors if the directory already exists. Defaults to an auto-named \
                     `dolos-report-<timestamp>-<name>` directory in the current directory. \
                     Has no effect for terminal output."
    )]
    pub output_destination: Option<PathBuf>,

    #[arg(
        short = 'p',
        long,
        default_value = "3000",
        value_parser = clap::value_parser!(u16).range(1..),
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

    #[arg(long, long_help = "Open the browser for web output.")]
    pub open_browser: bool,
}

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
        dolos_args: DolosArgs,

        #[clap(flatten)]
        output_args: OutputArgs,
    },
}

#[cfg(test)]
mod tests {
    use super::*;
    use rstest::rstest;

    /// Parse `dolos run a.js b.js [extra...]`.
    fn parse(extra: &[&str]) -> Result<Opts, clap::Error> {
        let mut args = vec!["dolos", "run", "a.js", "b.js"];
        args.extend_from_slice(extra);
        Opts::try_parse_from(args)
    }

    /// The `DolosConfig` of the parsed options. Panics if clap rejects them.
    fn config(extra: &[&str]) -> std::io::Result<DolosConfig> {
        match parse(extra).unwrap().command {
            Command::Run { dolos_args, .. } => dolos_args.try_into(),
        }
    }

    /// The `OutputArgs` of the parsed options. Panics if clap rejects them.
    fn output(extra: &[&str]) -> OutputArgs {
        match parse(extra).unwrap().command {
            Command::Run { output_args, .. } => output_args,
        }
    }

    #[test]
    fn run_without_options_uses_the_defaults() {
        assert_eq!(config(&[]).unwrap(), DolosConfig::default());
    }

    #[test]
    fn run_options_set_the_config() {
        #[rustfmt::skip]
        let cfg = config(&[
            "-k", "10",
            "-w", "5",
            "-s", "10",
            "-m", "2",
            "-M", "0.9",
            "-n", "custom",
            "-l", "javascript",
            "--sort-by", "similarity",
            "-b", "kgrams-ascending",
            "-C",
            "-c",
            "--include-analysis-data",
        ])
        .unwrap();

        let expected = DolosConfig::builder()
            .kgram_length(10)
            .kgrams_in_window(5)
            .min_length_match(10)
            .max_fingerprint_count(2)
            .max_fingerprint_percentage(0.9)
            .name("custom")
            .language(Language::Javascript)
            .sort_by(PairSortBy::Similarity)
            .fragment_sort_by(FragmentSortBy::KgramsAscending)
            .include_comments(true)
            .compare(true)
            .include_analysis_data(true)
            .build()
            .unwrap();
        assert_eq!(cfg, expected);
    }

    #[rstest]
    #[case::k_zero(&["-k", "0"])]
    #[case::w_zero(&["-w", "0"])]
    #[case::s_zero(&["-s", "0"])]
    #[case::m_zero(&["-m", "0"])]
    #[case::big_percentage(&["-M", "1.5"])]
    fn config_rejects_out_of_range_values(#[case] extra: &[&str]) {
        assert!(config(extra).is_err());
    }

    #[rstest]
    #[case::language(&["-l", "notalang"])]
    #[case::sort_by(&["--sort-by", "bogus"])]
    #[case::port_zero(&["-p", "0"])]
    fn parse_rejects_invalid_values(#[case] extra: &[&str]) {
        assert!(parse(extra).is_err());
    }

    #[test]
    fn run_without_files_is_rejected() {
        assert!(Opts::try_parse_from(["dolos", "run"]).is_err());
    }

    #[test]
    fn run_without_output_options_uses_the_defaults() {
        let args = output(&[]);
        assert_eq!(args.output_format, OutputFormat::Terminal);
        assert_eq!(args.port, 3000);
        assert_eq!(args.host, "localhost");
        assert!(!args.open_browser);
    }

    #[test]
    fn output_options_set_the_output_args() {
        #[rustfmt::skip]
        let args = output(&[
            "-f", "web",
            "-p", "8080",
            "-H", "0.0.0.0",
            "--open-browser",
        ]);

        assert_eq!(args.output_format, OutputFormat::Web);
        assert_eq!(args.port, 8080);
        assert_eq!(args.host, "0.0.0.0");
        assert!(args.open_browser);
    }
}
