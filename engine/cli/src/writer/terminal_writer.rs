use crate::writer::output::OutputWriter;
use colored::Colorize;
use dolos::{Fragment, Pair, Region};
use std::io::Result;

/// Terminal writer that outputs similarity results to stdout.
pub struct TerminalWriter;

/// Get the half-width for each side of the side-by-side display.
/// We subtract 6 instead of the bare 3-char separator to add a small safety
/// margin for terminals that report a slightly larger width than they render.
fn column_width() -> usize {
    terminal_size::terminal_size()
        .map(|(w, _)| (w.0 as usize).saturating_sub(10) / 2)
        .unwrap_or(60)
        .min(100)
}

impl OutputWriter for TerminalWriter {
    fn write_pair(&mut self, pair: &Pair) -> Result<()> {
        let m = &pair.metrics;
        println!(
            "{} - {} (sim: {:.2}%, longest: {}, left: {}/{}, right: {}/{})",
            pair.left_file.relative_path.display(),
            pair.right_file.relative_path.display(),
            m.similarity * 100.0,
            m.longest_fragment,
            m.overlap_left,
            m.total_left,
            m.overlap_right,
            m.total_right,
        );

        if pair.fragments.is_some() {
            Self::write_fragments(pair);
        }

        Ok(())
    }

    fn finish(self) -> Result<()> {
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
        let fragments = pair.fragments.as_ref().expect("missing fragments for pair");

        let left_lines: Vec<&str> = pair.left_file.content.lines().collect();
        let right_lines: Vec<&str> = pair.right_file.content.lines().collect();

        let col_width = column_width();
        println!();
        println!(
            " {:<width$}   {}",
            pair.left_file.relative_path.display().to_string().bold(),
            pair.right_file.relative_path.display().to_string().bold(),
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

    /// Write a single fragment as a side-by-side colored block.
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

        let left_code_width = col_width - left_num_width - 1;
        let right_code_width = col_width - right_num_width - 1;

        // Pre-render each DisplayLine to (possibly multiple) wrapped visual rows.
        let left_rows: Vec<String> = left_display
            .iter()
            .flat_map(|dl| Self::format_line(dl, left_num_width, left_code_width))
            .collect();
        let right_rows: Vec<String> = right_display
            .iter()
            .flat_map(|dl| Self::format_line(dl, right_num_width, right_code_width))
            .collect();

        let blank_line = " ".repeat(col_width);
        for i in 0..left_rows.len().max(right_rows.len()) {
            let left_col = left_rows.get(i).unwrap_or(&blank_line);
            let right_col = right_rows.get(i).unwrap_or(&blank_line);
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
        for (i, line) in lines[display_start..=display_end].iter().enumerate() {
            let row = display_start + i;
            let is_match = row >= start_row && row <= end_row;

            let hl_start = if row == start_row { start_col } else { 0 };
            let hl_end = if row == end_row { end_col } else { line.len() };

            result.push(DisplayLine {
                line_number: row + 1,
                code: line,
                is_match,
                highlight_start_col: is_match.then_some(hl_start),
                highlight_end_col: is_match.then_some(hl_end),
            });
        }
        result
    }

    /// Format a single display line into one or more fixed-width visual rows,
    /// wrapping long code at `code_width` byte-aligned char boundaries.
    ///
    /// Continuation rows are indented by the same leading whitespace as the
    /// original line so that wrapped content stays visually aligned with the
    /// first row's non-whitespace start. Each visual row is exactly
    /// `num_width + 1 + code_width` characters wide.
    fn format_line(dl: &DisplayLine, num_width: usize, code_width: usize) -> Vec<String> {
        let mut offset = 0;
        let mut rows = Vec::new();

        while rows.is_empty() || offset < dl.code.len() {
            let end = (offset + code_width).min(dl.code.len());
            let chunk = &dl.code[offset..end];

            let num_prefix = format!(
                "{:>num_width$}",
                if offset == 0 {
                    dl.line_number.to_string()
                } else {
                    "|".to_string()
                }
            );
            let padded = format!("{:<code_width$}", chunk);

            if dl.is_match {
                let hl_start = dl
                    .highlight_start_col
                    .expect("a match should have highlighting")
                    .saturating_sub(offset)
                    .min(chunk.len());
                let hl_end = dl
                    .highlight_end_col
                    .expect("a match should have highlighting")
                    .saturating_sub(offset)
                    .min(chunk.len());

                rows.push(format!(
                    "{} {}{}{}",
                    num_prefix.dimmed(),
                    padded[..hl_start].dimmed(),
                    padded[hl_start..hl_end].red(),
                    padded[hl_end..].dimmed()
                ));
            } else {
                rows.push(format!("{num_prefix} {padded}").dimmed().to_string());
            }

            offset = end;
        }

        rows
    }
}

// ── Tests ────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use dolos::Point;

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

    #[test]
    fn test_collect_display_lines_mid_file() {
        // Regression: when the match is not at the top of the file, line numbers
        // must reflect the actual file row, not the slice-local index.
        let lines = vec!["l0", "l1", "l2", "l3", "l4", "l5"];
        // Match at rows 3-4 (0-based): display_start = 2, display_end = 5.
        let region = Region::new(Point::new(3, 1), Point::new(4, 2));
        let display = TerminalWriter::collect_display_lines(&lines, &region);

        assert_eq!(display.len(), 4);

        // row 2 — context before: file line 3 (1-based)
        assert_eq!(display[0].line_number, 3);
        assert_eq!(display[0].code, "l2");
        assert!(!display[0].is_match);

        // row 3 — match start: file line 4
        assert_eq!(display[1].line_number, 4);
        assert_eq!(display[1].code, "l3");
        assert!(display[1].is_match);
        assert_eq!(display[1].highlight_start_col, Some(1));
        assert_eq!(display[1].highlight_end_col, Some(2));

        // row 4 — match end: file line 5
        assert_eq!(display[2].line_number, 5);
        assert_eq!(display[2].code, "l4");
        assert!(display[2].is_match);
        assert_eq!(display[2].highlight_start_col, Some(0));
        assert_eq!(display[2].highlight_end_col, Some(2));

        // row 5 — context after: file line 6
        assert_eq!(display[3].line_number, 6);
        assert_eq!(display[3].code, "l5");
        assert!(!display[3].is_match);
    }
}
