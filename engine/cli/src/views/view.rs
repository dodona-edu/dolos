use crate::opts::{OutputArgs, OutputFormat};
use crate::views::csv::CsvView;
use crate::views::terminal::TerminalView;
use crate::views::web::WebView;
use dolos::Report;
use std::io::Result;

/// Shows the results of an analysis.
pub trait View {
    /// Show the report. Blocks until the output is complete: the report is
    /// printed, the files are written, or the web server has stopped.
    fn show(&self, report: &Report) -> Result<()>;
}

/// Show the report in the requested output format.
pub fn show(args: OutputArgs, report: &Report) -> Result<()> {
    match args.output_format {
        OutputFormat::Csv => CsvView::new(args.output_destination).show(report),
        OutputFormat::Terminal | OutputFormat::Console => TerminalView.show(report),
        OutputFormat::Html | OutputFormat::Web => WebView::new(
            args.output_destination,
            args.host,
            args.port,
            args.open_browser,
        )
        .show(report),
    }
}
