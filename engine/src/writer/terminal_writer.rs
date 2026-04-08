use crate::fragment::Fragment;
use crate::report::Pair;
use crate::winnowing::region::Region;
use crate::writer::writer::OutputWriter;
use colored::Colorize;
use std::io;

/// Terminal writer that outputs similarity results to stdout.
pub struct TerminalWriter;

/// Get the half-width for each side of the side-by-side display.
fn column_width() -> usize {
    terminal_size::terminal_size()
        .map(|(w, _)| (w.0 as usize).saturating_sub(3) / 2)
        .unwrap_or(60)
        .min(120)
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

        if pair.fragments.is_some() {
            Self::write_fragments(pair);
        }

        Ok(())
    }

    fn finish(self) -> io::Result<()> {
        Ok(())
    }
}

// ── Display-line helpers ─────────────────────────────────────────────

/// A numbered source line together with a flag that says whether it is part of
/// the matched region or merely context.
struct DisplayLine<'a> {
    /// 1-based line number.
    line_number: usize,
    /// The text content (no trailing newline).
    code: &'a str,
    /// `true` when the match (partially) covers this line.
    is_match: bool,
    /// 0-based column where the highlight starts on this line.
    highlight_start_col: Option<usize>,
    /// 0-based column where the highlight ends (exclusive).
    highlight_end_col: Option<usize>,
}

impl TerminalWriter {
    // ── Fragment rendering ───────────────────────────────────────────────

    fn write_fragments(pair: &Pair) {
        let fragments = pair.fragments.expect("missing fragments for pair");

        let left_lines: Vec<&str> = pair
            .left_file
            .content
            .as_ref()
            .expect("missing source content for left file")
            .lines()
            .collect();
        let right_lines: Vec<&str> = pair
            .right_file
            .content
            .as_ref()
            .expect("missing source content for right file")
            .lines()
            .collect();

        let col_width = column_width();
        println!();
        println!(
            " {:<width$}   {}",
            pair.left_file.path.display().to_string().bold(),
            pair.right_file.path.display().to_string().bold(),
            width = col_width,
        );
        println!();
        println!(" Total fragments: {} fragments", fragments.len());
        println!(
            " Total overlap: {} fingerprints",
            fragments.iter().map(|f| f.fingerprint_count).sum::<usize>()
        );

        let total = fragments.len();
        for (i, frag) in fragments.iter().enumerate() {
            println!("\n{}\n", format!("Fragment {}/{}:", i + 1, total).bold());
            Self::write_fragment(frag, &left_lines, &right_lines, col_width);
            println!();
        }
    }

    /// Write a single fragment as a side-by-side coloured block.
    fn write_fragment(
        frag: &Fragment,
        left_lines: &[&str],
        right_lines: &[&str],
        col_width: usize,
    ) {
        let left_display = Self::collect_display_lines(left_lines, &frag.left_region);
        let right_display = Self::collect_display_lines(right_lines, &frag.right_region);

        let left_num_width = left_display
            .last()
            .expect("Fragment can not be empty")
            .line_number
            .to_string()
            .len();
        let right_num_width = right_display
            .last()
            .expect("Fragment can not be empty")
            .line_number
            .to_string()
            .len();

        // Side-by-side lines
        for i in 0..left_display.len().max(right_display.len()) {
            let left_col = left_display
                .get(i)
                .map(|dl| Self::format_line(dl, left_num_width, col_width - left_num_width - 1))
                .unwrap_or_else(|| " ".repeat(col_width));
            let right_col = right_display
                .get(i)
                .map(|dl| Self::format_line(dl, right_num_width, col_width - right_num_width - 1))
                .unwrap_or_default();

            println!("{}   {}", left_col, right_col);
        }
    }

    // ── Display-line helpers ─────────────────────────────────────────────

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

            let hl_start = (row == start_row).then_some(start_col).unwrap_or(0);
            let hl_end = (row == end_row)
                .then_some(end_col)
                .unwrap_or(lines[row].len());

            result.push(DisplayLine {
                line_number: row + 1,
                code: lines[row],
                is_match,
                highlight_start_col: is_match.then(|| hl_start),
                highlight_end_col: is_match.then(|| hl_end),
            });
        }
        result
    }

    /// Truncate `text` to `width` characters, replacing the last 3 with `...`
    /// when truncated, then pad with spaces to exactly `width` characters.
    fn render_code(text: &str, width: usize) -> String {
        const ELLIPSIS: &str = "...";
        if text.chars().count() > width {
            let keep = width.saturating_sub(ELLIPSIS.len());
            let truncated: String = text.chars().take(keep).collect();
            format!("{truncated}{ELLIPSIS}")
        } else {
            format!("{text:<width$}")
        }
    }

    /// Format a single display line into a fixed-width string with line number,
    /// optionally wrapped in colour when `is_match` is true.
    ///
    /// When only part of the line is matched (column-level precision), only that
    /// portion is highlighted in red; the rest of the line is dimmed.
    fn format_line(dl: &DisplayLine, num_width: usize, code_width: usize) -> String {
        let line_num = format!("{:>num_width$}", dl.line_number);
        let text = Self::render_code(dl.code, code_width);

        if !dl.is_match {
            return format!("{line_num} {text}").dimmed().to_string();
        }

        // Text may be shortened due to terminal size
        let hl_start = dl
            .highlight_start_col
            .expect("a match should have highlighting")
            .min(text.len() - 1);
        let hl_end = dl
            .highlight_end_col
            .expect("a match should have highlighting")
            .min(text.len());

        let before = &text[..hl_start];
        let matched = &text[hl_start..hl_end];
        let after = &text[hl_end..];
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
    use crate::winnowing::region::Point;

    #[test]
    fn test_collect_display_lines_with_context() {
        let lines = vec!["line0", "line1", "line2", "line3", "line4"];
        // Match covers rows 1-3, columns 0-2 on the last row.
        let region = Region::new(Point::new(1, 0), Point::new(3, 2));
        let display = TerminalWriter::collect_display_lines(&lines, &region);

        assert_eq!(display.len(), 5);

        // row 0 — context before
        assert_eq!(display[0].line_number, 1);
        assert_eq!(display[0].code, "line0");
        assert!(!display[0].is_match);
        assert_eq!(display[0].highlight_start_col, None);
        assert_eq!(display[0].highlight_end_col, None);

        // row 1 — match start (start_col = 0, full line)
        assert_eq!(display[1].line_number, 2);
        assert_eq!(display[1].code, "line1");
        assert!(display[1].is_match);
        assert_eq!(display[1].highlight_start_col, Some(0));
        assert_eq!(display[1].highlight_end_col, Some(5));

        // row 2 — match middle (full line)
        assert_eq!(display[2].line_number, 3);
        assert_eq!(display[2].code, "line2");
        assert!(display[2].is_match);
        assert_eq!(display[2].highlight_start_col, Some(0));
        assert_eq!(display[2].highlight_end_col, Some(5));

        // row 3 — match end (end_col = 2)
        assert_eq!(display[3].line_number, 4);
        assert_eq!(display[3].code, "line3");
        assert!(display[3].is_match);
        assert_eq!(display[3].highlight_start_col, Some(0));
        assert_eq!(display[3].highlight_end_col, Some(2));

        // row 4 — context after
        assert_eq!(display[4].line_number, 5);
        assert_eq!(display[4].code, "line4");
        assert!(!display[4].is_match);
        assert_eq!(display[4].highlight_start_col, None);
        assert_eq!(display[4].highlight_end_col, None);
    }
}
