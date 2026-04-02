use crate::fragment::Fragment;
use crate::report::Pair;
use crate::winnowing::region::Region;
use crate::writer::writer::OutputWriter;
use colored::Colorize;
use std::io;
use std::io::Write;

/// Terminal writer that outputs similarity results to stdout.
pub struct TerminalWriter;

/// Get the half-width for each side of the side-by-side display.
fn column_width() -> usize {
    terminal_size::terminal_size()
        .map(|(w, _)| (w.0 as usize).saturating_sub(3) / 2)
        .unwrap_or(60)
}

impl OutputWriter for TerminalWriter {
    fn write_pair(&mut self, pair: &Pair) -> io::Result<()> {
        println!(
            "{} - {} (sim: {:.2}%, longest: {})",
            pair.left_file.file_name(),
            pair.right_file.file_name(),
            pair.similarity * 100.0,
            pair.longest_fragment
        );

        write_fragments(&mut io::stdout().lock(), pair)?;

        Ok(())
    }

    fn finish(self) -> io::Result<()> {
        Ok(())
    }
}

// ── Fragment rendering ───────────────────────────────────────────────

/// Write all fragments for a pair to `w`, including a summary header.
///
/// Returns immediately when the pair has no stored fragments.
fn write_fragments<W: Write>(w: &mut W, pair: &Pair) -> io::Result<()> {
    let fragments = match pair.fragments {
        Some(f) if !f.is_empty() => f,
        _ => return Ok(()),
    };

    let left_content = pair.left_file.content.as_deref().ok_or_else(|| {
        io::Error::new(io::ErrorKind::Other, "missing source content for left file")
    })?;
    let right_content = pair.right_file.content.as_deref().ok_or_else(|| {
        io::Error::new(
            io::ErrorKind::Other,
            "missing source content for right file",
        )
    })?;
    let left_lines: Vec<&str> = left_content.lines().collect();
    let right_lines: Vec<&str> = right_content.lines().collect();

    let col_width = column_width();
    let total = fragments.len();
    writeln!(w)?;
    writeln!(
        w,
        " {:<width$}   {}",
        pair.left_file.path.display().to_string().bold(),
        pair.right_file.path.display().to_string().bold(),
        width = col_width,
    )?;
    writeln!(w)?;
    writeln!(
        w,
        " Total overlap: {} fingerprints",
        fragments.iter().map(|f| f.fingerprint_count).sum::<usize>()
    )?;

    for (i, frag) in fragments.iter().enumerate() {
        write_fragment(w, frag, i, total, &left_lines, &right_lines, col_width)?;
    }

    Ok(())
}

/// Write a single fragment as a side-by-side coloured block.
fn write_fragment<W: Write>(
    w: &mut W,
    frag: &Fragment,
    index: usize,
    total: usize,
    left_lines: &[&str],
    right_lines: &[&str],
    col_width: usize,
) -> io::Result<()> {
    let left_display = collect_display_lines(left_lines, &frag.left_region);
    let right_display = collect_display_lines(right_lines, &frag.right_region);

    // Header – build the visible text first, then colour it, so padding is
    // computed on the visible width alone.
    let header_text = format!("Fragment {}/{}:", index + 1, total);
    writeln!(w)?;
    writeln!(
        w,
        "{:>width$}",
        header_text.bold(),
        width = col_width * 2 + 3,
    )?;
    writeln!(w)?;

    // Side-by-side lines
    let max_rows = left_display.len().max(right_display.len());
    for i in 0..max_rows {
        let left_col = left_display
            .get(i)
            .map(|dl| format_line(dl, col_width))
            .unwrap_or_else(|| " ".repeat(col_width));
        let right_col = right_display
            .get(i)
            .map(|dl| format_line(dl, col_width))
            .unwrap_or_default();

        writeln!(w, "{}   {}", left_col, right_col)?;
    }

    Ok(())
}

// ── Display-line helpers ─────────────────────────────────────────────

/// A numbered source line together with a flag that says whether it is part of
/// the matched region or merely context.
struct DisplayLine<'a> {
    /// 1-based line number.
    line_number: usize,
    /// The text content (no trailing newline).
    text: &'a str,
    /// `true` when this line is (partially) covered by the match.
    is_match: bool,
    /// 0-based column where the highlight starts on this line (`0` for full-line matches).
    highlight_start_col: usize,
    /// 0-based column where the highlight ends (exclusive). `usize::MAX` means "until end of line".
    highlight_end_col: usize,
}

/// Collect the lines to display for one side of a fragment, including one
/// context line before and after (when available).
fn collect_display_lines<'a>(lines: &'a [&str], region: &Region) -> Vec<DisplayLine<'a>> {
    let start_row = region.start_point.row;
    let end_row = region.end_point.row;
    let start_col = region.start_point.column;
    let end_col = region.end_point.column;

    let context_before = if start_row > 0 { 1 } else { 0 };
    let context_after = if end_row + 1 < lines.len() { 1 } else { 0 };

    let display_start = start_row - context_before;
    let display_end = end_row + context_after; // inclusive

    let mut result = Vec::new();
    for row in display_start..=display_end {
        let is_match = row >= start_row && row <= end_row;
        let (hl_start, hl_end) = if !is_match {
            (0, 0)
        } else if start_row == end_row {
            (start_col, end_col)
        } else if row == start_row {
            (start_col, usize::MAX)
        } else if row == end_row {
            (0, end_col)
        } else {
            (0, usize::MAX)
        };

        result.push(DisplayLine {
            line_number: row + 1,
            text: lines[row],
            is_match,
            highlight_start_col: hl_start,
            highlight_end_col: hl_end,
        });
    }
    result
}

/// Format a single display line into a fixed-width string with line number,
/// optionally wrapped in colour when `is_match` is true.
///
/// When only part of the line is matched (column-level precision), only that
/// portion is highlighted in red; the rest of the line is dimmed.
fn format_line(dl: &DisplayLine, width: usize) -> String {
    let num_width = 3;
    let code_width = width.saturating_sub(num_width + 1);
    let truncated: String = dl.text.chars().take(code_width).collect();
    let padded = format!("{:<code_width$}", truncated);

    let line_num = format!("{:>num_width$}", dl.line_number);

    if !dl.is_match {
        return format!("{}", format!("{line_num} {padded}").dimmed());
    }

    let hl_start = dl.highlight_start_col.min(padded.len());
    let hl_end = dl.highlight_end_col.min(padded.len());

    if hl_start == 0 && hl_end >= padded.len() {
        format!("{}", format!("{line_num} {padded}").red())
    } else {
        let before = &padded[..hl_start];
        let matched = &padded[hl_start..hl_end];
        let after = &padded[hl_end..];
        format!(
            "{} {}{}{}",
            line_num.dimmed(),
            before.dimmed(),
            matched.red(),
            after.dimmed(),
        )
    }
}

// ── Tests ────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use crate::file::File;
    use crate::fragment::Fragment;
    use crate::language::Language;
    use crate::winnowing::region::Point;

    fn row_region(start_row: usize, end_row: usize) -> Region {
        Region::new(
            0,
            0,
            Point::new(start_row, 0),
            Point::new(end_row, usize::MAX),
        )
    }

    #[test]
    fn test_collect_display_lines_with_context() {
        let lines = vec!["line0", "line1", "line2", "line3", "line4"];
        let region = row_region(1, 3);
        let display = collect_display_lines(&lines, &region);

        assert_eq!(display.len(), 5);
        assert!(!display[0].is_match);
        assert!(display[1].is_match);
        assert!(display[2].is_match);
        assert!(display[3].is_match);
        assert!(!display[4].is_match);
        assert_eq!(display[0].line_number, 1);
    }

    #[test]
    fn test_collect_display_lines_at_start() {
        let lines = vec!["line0", "line1", "line2"];
        let region = row_region(0, 0);
        let display = collect_display_lines(&lines, &region);

        assert_eq!(display.len(), 2);
        assert!(display[0].is_match);
        assert!(!display[1].is_match);
    }

    #[test]
    fn test_collect_display_lines_at_end() {
        let lines = vec!["line0", "line1", "line2"];
        let region = row_region(2, 2);
        let display = collect_display_lines(&lines, &region);

        assert_eq!(display.len(), 2);
        assert!(!display[0].is_match);
        assert!(display[1].is_match);
    }

    #[test]
    fn test_write_fragment_output_contains_header() {
        let left_lines = vec!["line0", "line1", "line2"];
        let right_lines = vec!["lineA", "lineB", "lineC"];
        let frag = Fragment {
            left_region: Region::new(0, 0, Point::new(1, 0), Point::new(1, usize::MAX)),
            right_region: Region::new(0, 0, Point::new(0, 0), Point::new(1, usize::MAX)),
            fingerprint_count: 2,
        };

        let mut buf = Vec::new();
        write_fragment(&mut buf, &frag, 0, 3, &left_lines, &right_lines, 60).unwrap();
        let output = String::from_utf8(buf).unwrap();

        assert!(output.contains("Fragment 1/3:"));
        assert!(output.contains("line1"));
        assert!(output.contains("lineA"));
    }

    #[test]
    fn test_format_line_context_is_dimmed() {
        let dl = DisplayLine {
            line_number: 1,
            text: "context",
            is_match: false,
            highlight_start_col: 0,
            highlight_end_col: 0,
        };
        let formatted = format_line(&dl, 40);
        assert!(formatted.contains("context"));
    }

    #[test]
    fn test_write_fragments_no_fragments() {
        let left_file = File {
            path: "a.js".into(),
            language: Language::Javascript,
            content: None,
        };
        let right_file = File {
            path: "b.js".into(),
            language: Language::Javascript,
            content: None,
        };
        let pair = Pair {
            left_file: &left_file,
            right_file: &right_file,
            similarity: 0.0,
            longest_fragment: 0,
            fragments: None,
        };

        let mut buf = Vec::new();
        write_fragments(&mut buf, &pair).unwrap();
        assert!(buf.is_empty());
    }

    #[test]
    fn test_write_fragments_empty_slice() {
        let left_file = File {
            path: "a.js".into(),
            language: Language::Javascript,
            content: None,
        };
        let right_file = File {
            path: "b.js".into(),
            language: Language::Javascript,
            content: None,
        };
        let pair = Pair {
            left_file: &left_file,
            right_file: &right_file,
            similarity: 0.0,
            longest_fragment: 0,
            fragments: Some(&[]),
        };

        let mut buf = Vec::new();
        write_fragments(&mut buf, &pair).unwrap();
        assert!(buf.is_empty());
    }

    #[test]
    fn test_write_fragments_renders_fragment() {
        let left_file = File {
            path: "a.js".into(),
            language: Language::Javascript,
            content: Some("line0\nline1\nline2\n".to_string()),
        };
        let right_file = File {
            path: "b.js".into(),
            language: Language::Javascript,
            content: Some("lineA\nlineB\nlineC\n".to_string()),
        };
        let fragments = vec![Fragment {
            left_region: Region::new(0, 0, Point::new(0, 0), Point::new(1, usize::MAX)),
            right_region: Region::new(0, 0, Point::new(1, 0), Point::new(1, usize::MAX)),
            fingerprint_count: 3,
        }];
        let pair = Pair {
            left_file: &left_file,
            right_file: &right_file,
            similarity: 0.5,
            longest_fragment: 3,
            fragments: Some(&fragments),
        };

        let mut buf = Vec::new();
        write_fragments(&mut buf, &pair).unwrap();
        let output = String::from_utf8(buf).unwrap();

        assert!(output.contains("Fragment 1/1:"));
        assert!(output.contains("Total overlap: 3 fingerprints"));
        assert!(output.contains("line0"));
        assert!(output.contains("lineB"));
    }
}
