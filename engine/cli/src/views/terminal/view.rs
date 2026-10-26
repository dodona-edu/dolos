use crate::views::terminal::fragment;
use crate::views::view::View;
use dolos::{Pair, Report};
use std::io::{BufWriter, Result, Write};

/// Prints the report to the terminal.
pub struct TerminalView;

impl View for TerminalView {
    fn show(&self, report: &Report) -> Result<()> {
        let stdout = std::io::stdout().lock();
        let mut out = BufWriter::new(stdout);
        self.render(report, &mut out)?;
        out.flush()
    }
}

impl TerminalView {
    /// Render the whole report to `out`.
    fn render(&self, report: &Report, out: &mut impl Write) -> Result<()> {
        for pair in &report.pairs {
            write_summary(pair, out)?;
            if pair.fragments.is_some() {
                fragment::write_all(pair, out)?;
            }
        }
        Ok(())
    }
}

/// Write the one-line metrics summary of a pair.
fn write_summary(pair: &Pair, out: &mut impl Write) -> Result<()> {
    let m = &pair.metrics;
    writeln!(
        out,
        "{} - {} (sim: {:.2}%, longest: {}, left: {}/{}, right: {}/{})",
        pair.left_file.relative_path.display(),
        pair.right_file.relative_path.display(),
        m.similarity * 100.0,
        m.longest_match,
        m.overlap_left,
        m.total_left,
        m.overlap_right,
        m.total_right,
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use dolos::{File, PairMetrics};
    use std::rc::Rc;

    fn file(id: usize, path: &str) -> Rc<File> {
        Rc::new(File { id, relative_path: path.into(), content: String::new() })
    }

    /// The summary line reports the metrics of the pair.
    #[test]
    fn test_write_summary() {
        let pair = Pair {
            left_file: file(0, "left.js"),
            right_file: file(1, "right.js"),
            metrics: PairMetrics {
                similarity: 0.5,
                total_left: 4,
                total_right: 4,
                overlap_left: 2,
                overlap_right: 1,
                longest_match: 3,
            },
            fragments: None,
        };

        let mut out = Vec::new();
        write_summary(&pair, &mut out).unwrap();

        assert_eq!(
            String::from_utf8(out).unwrap(),
            "left.js - right.js (sim: 50.00%, longest: 3, left: 2/4, right: 1/4)\n"
        );
    }
}
