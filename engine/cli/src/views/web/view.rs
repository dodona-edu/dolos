use crate::views::csv::CsvView;
use crate::views::view::View;
use crate::views::web::server::{Server, serve};
use dolos::Report;
use std::io::Result;
use std::path::PathBuf;

/// Serves the report over HTTP.
///
/// The report is written as CSV files first. The server then serves that
/// directory under `/data`, next to the frontend.
pub struct WebView {
    csv: CsvView,
    server: Server,
}

impl WebView {
    pub fn new(destination: Option<PathBuf>, host: String, port: u16, open_browser: bool) -> Self {
        Self {
            csv: CsvView::new(destination),
            server: Server { host, port, open_browser },
        }
    }
}

impl View for WebView {
    fn show(&self, report: &Report) -> Result<()> {
        let directory = self.csv.write(report)?;
        serve(directory.path(), &self.server)
    }
}
