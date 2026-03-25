use clap::{Parser, Subcommand};

use std::path::PathBuf;

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
        long_help = "The length of each kgram fragment. (default: 23)"
    )]
    pub kgram_length: usize,

    #[arg(
        short = 'w',
        long,
        default_value = "17",
        long_help = "The size of the window that will be used (in kgrams). (default: 17)"
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
        long_help = "The -m option sets the maximum number of times a given fingerprint may appear before it is ignored. A code fragment that appears in many programs is probably legitimate sharing and not the result of plagiarism. With -m N any fingerprint appearing in more than N programs is filtered out. This option has precedence over the -M option, which is set to 0.9 by default."
    )]
    pub max_fingerprint_count: Option<usize>,

    #[arg(
        short = 'M',
        long,
        default_value = "0.9",
        long_help = "The -M option sets how many percent of the files the fingerprint may appear in before it is ignored. A fingerprint that appears in many programs is probably a legitimate fingerprint and not the result of plagiarism. With -M N any fingerprint appearing in more than N percent of the files is filtered out. Must be a value between 0 and 1. This option is ignored when comparing only two files, because each match appear in 100% of the files"
    )]
    pub max_fingerprint_percentage: Option<f64>,

    #[arg(
        short = 'i',
        long,
        long_help = "Path of a file with template/boilerplate code. Code fragments matching with this file will be ignored."
    )]
    pub ignore: Option<PathBuf>,

    #[arg(
        short = 's',
        long,
        default_value = "0",
        long_help = "The minimum amount of kgrams a fragment should contain. Every fragment with less kgrams then the specified amount is filtered out. (default: 0)"
    )]
    pub min_fragment_length: usize,

    #[arg(
        short = 'C',
        long,
        default_value = "false",
        long_help = "Include the comments during the tokenization process."
    )]
    pub include_comments: bool,
}

#[derive(Parser, Debug)]
pub struct ReportArgs {
    #[arg(
        short = 'S',
        long,
        long_help = "The minimum similarity between two files. Must be a value between 0 and 1"
    )]
    pub min_similarity: Option<f64>,

    #[arg(
        long,
        value_enum,
        long_help = "Which field to sort the pairs by. Options are: similarity, total overlap, and longest fragment (default: \"total overlap\")"
    )]
    pub sort_by: Option<PairSortBy>,

    #[arg(
        short = 'b',
        long,
        value_enum,
        long_help = "How to sort the fragments by the amount of matches, only applicable in terminal comparison output. The options are: 'kgrams ascending', 'kgrams descending' and 'file order' (default: \"file order\")"
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

    #[arg(value_enum, short = 'f', long, default_value_t = OutputFormat::Terminal, long_help = "Specifies what format the output should be in, current options are: terminal/console, csv, html/web. (default: \"terminal\")")]
    pub output_format: OutputFormat,

    #[arg(
        short = 'o',
        long,
        default_value = ".",
        long_help = "Path where to write the output report to. This has no effect when the output format is set to 'terminal'."
    )]
    pub output_destination: PathBuf,

    #[arg(
        short = 'L',
        long,
        long_help = "Specifies how many matching file pairs are shown in the result. All pairs are shown when this option is omitted."
    )]
    pub limit_results: Option<usize>,

    #[arg(
        short = 'c',
        long,
        long_help = "Print a comparison of the matching fragments even if analysing more than two files. Only valid when the output is set to 'terminal' or 'console'."
    )]
    pub compare: bool,

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
