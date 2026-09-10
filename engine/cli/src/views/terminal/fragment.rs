use colored::Colorize;
use dolos::{Fragment, Pair, Region};
use std::io::{Result, Write};
use std::ops::Range;

/// Write every fragment of a pair as a side-by-side block.
pub fn write_all(pair: &Pair, out: &mut impl Write) -> Result<()> {
    let fragments = pair.fragments.as_ref().expect("missing fragments for pair");

    let left_lines: Vec<&str> = pair.left_file.content.lines().collect();
    let right_lines: Vec<&str> = pair.right_file.content.lines().collect();
    let width = column_width();

    writeln!(out)?;
    writeln!(
        out,
        " {:<width$}   {}",
        pair.left_file.relative_path.display().to_string().bold(),
        pair.right_file.relative_path.display().to_string().bold(),
    )?;
    writeln!(out)?;
    writeln!(out, " Total fragments: {} fragments", fragments.len())?;
    writeln!(
        out,
        " Total overlap: {} fingerprints",
        fragments.iter().map(|f| f.fingerprint_count).sum::<usize>()
    )?;

    let total = fragments.len();
    for (i, fragment) in fragments.iter().enumerate() {
        writeln!(
            out,
            "\n{}\n",
            format!("Fragment {}/{}:", i + 1, total).bold()
        )?;
        write_one(fragment, &left_lines, &right_lines, width, out)?;
        writeln!(out)?;
    }
    Ok(())
}

/// The half-width for each side of the side-by-side display.
///
/// Subtracts 10 instead of the bare 3-character separator to add a margin for
/// terminals that report a slightly larger width than they render.
fn column_width() -> usize {
    terminal_size::terminal_size()
        .map(|(w, _)| (w.0 as usize).saturating_sub(10) / 2)
        .unwrap_or(60)
        .min(100)
}

/// Write one fragment as a side-by-side colored block.
fn write_one(
    fragment: &Fragment,
    left_lines: &[&str],
    right_lines: &[&str],
    width: usize,
    out: &mut impl Write,
) -> Result<()> {
    let left = Side::new(left_lines, &fragment.left_region, width);
    let right = Side::new(right_lines, &fragment.right_region, width);

    let blank = " ".repeat(width);
    for i in 0..left.rows.len().max(right.rows.len()) {
        let left_column = left.rows.get(i).unwrap_or(&blank);
        let right_column = right.rows.get(i).unwrap_or(&blank);
        writeln!(out, "{left_column}   {right_column}")?;
    }
    Ok(())
}

/// One side of a side-by-side block, rendered to fixed-width visual rows.
struct Side {
    rows: Vec<String>,
}

impl Side {
    fn new(lines: &[&str], region: &Region, width: usize) -> Self {
        let display_lines = collect_display_lines(lines, region);
        let number_width = display_lines
            .last()
            .expect("Fragment can not be empty")
            .line_number
            .to_string()
            .len();
        let code_width = width.saturating_sub(number_width + 1).max(1);

        let rows = display_lines
            .iter()
            .flat_map(|line| line.format(number_width, code_width))
            .collect();
        Self { rows }
    }
}

/// A numbered source line together with the part of it that the match covers.
struct DisplayLine<'a> {
    /// 1-based line number.
    line_number: usize,
    /// The text content (no trailing newline).
    code: &'a str,
    /// Character range that the match covers, or `None` for a context line.
    highlight: Option<Range<usize>>,
}

impl DisplayLine<'_> {
    /// Format this line into one or more fixed-width visual rows, wrapping long
    /// code at `code_width`.
    ///
    /// Each visual row is exactly `number_width + 1 + code_width` characters
    /// wide. Continuation rows carry a `|` instead of the line number.
    fn format(&self, number_width: usize, code_width: usize) -> Vec<String> {
        let code: Vec<char> = self.code.chars().collect();
        let mut offset = 0;
        let mut rows = Vec::new();

        while rows.is_empty() || offset < code.len() {
            let end = (offset + code_width).min(code.len());
            let mut chunk = code[offset..end].to_vec();
            chunk.resize(code_width, ' ');
            let text = |range: Range<usize>| chunk[range].iter().collect::<String>();

            let number = format!(
                "{:>number_width$}",
                if offset == 0 {
                    self.line_number.to_string()
                } else {
                    "|".to_string()
                }
            );

            rows.push(match &self.highlight {
                Some(highlight) => {
                    let start = highlight.start.saturating_sub(offset).min(code_width);
                    // dolos-lib can report a region that ends before it starts.
                    let stop = highlight
                        .end
                        .saturating_sub(offset)
                        .min(code_width)
                        .max(start);
                    format!(
                        "{} {}{}{}",
                        number.dimmed(),
                        text(0..start).dimmed(),
                        text(start..stop).red(),
                        text(stop..code_width).dimmed()
                    )
                }
                None => format!("{number} {}", text(0..code_width))
                    .dimmed()
                    .to_string(),
            });

            offset = end;
        }

        rows
    }
}

/// Convert a byte column, as tree-sitter reports it, into a character index.
fn char_index(line: &str, byte_column: usize) -> usize {
    line.char_indices()
        .take_while(|(byte, _)| *byte < byte_column)
        .count()
}

/// Collect the lines to display for one side of a fragment, including one
/// context line before and after when available.
fn collect_display_lines<'a>(lines: &'a [&str], region: &Region) -> Vec<DisplayLine<'a>> {
    // `end_point` is exclusive, so a region that reaches the end of the file
    // names the row after the last line.
    let end_row = region.end_point.row.min(lines.len() - 1);
    // dolos-lib can report a region that ends before it starts.
    let start_row = region.start_point.row.min(end_row);

    let context_before = if start_row > 0 { 1 } else { 0 };
    let context_after = if end_row + 1 < lines.len() { 1 } else { 0 };

    let display_start = start_row - context_before;
    let display_end = end_row + context_after; // inclusive

    lines[display_start..=display_end]
        .iter()
        .enumerate()
        .map(|(i, line)| {
            let row = display_start + i;

            let highlight = (row >= start_row && row <= end_row).then(|| {
                let start = if row == start_row {
                    char_index(line, region.start_point.column)
                } else {
                    0
                };
                // A clamped end row keeps the highlight up to the line end.
                let end = if row == region.end_point.row {
                    char_index(line, region.end_point.column)
                } else {
                    line.chars().count()
                };
                start..end
            });

            DisplayLine { line_number: row + 1, code: line, highlight }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use dolos::Point;

    #[test]
    fn test_collect_display_lines_with_context() {
        let lines = vec!["line0", "line1", "line2", "line3", "line4"];
        // Match covers rows 1-3, columns 0-2 on the last row.
        let region = Region::new(Point::new(1, 0), Point::new(3, 2));
        let display = collect_display_lines(&lines, &region);

        assert_eq!(display.len(), 5);

        // row 0 — context before
        assert_eq!(display[0].line_number, 1);
        assert_eq!(display[0].code, "line0");
        assert_eq!(display[0].highlight, None);

        // row 1 — match start (start_col = 0, full line)
        assert_eq!(display[1].line_number, 2);
        assert_eq!(display[1].code, "line1");
        assert_eq!(display[1].highlight, Some(0..5));

        // row 2 — match middle (full line)
        assert_eq!(display[2].line_number, 3);
        assert_eq!(display[2].code, "line2");
        assert_eq!(display[2].highlight, Some(0..5));

        // row 3 — match end (end_col = 2)
        assert_eq!(display[3].line_number, 4);
        assert_eq!(display[3].code, "line3");
        assert_eq!(display[3].highlight, Some(0..2));

        // row 4 — context after
        assert_eq!(display[4].line_number, 5);
        assert_eq!(display[4].code, "line4");
        assert_eq!(display[4].highlight, None);
    }

    #[test]
    fn test_collect_display_lines_mid_file() {
        // Regression: when the match is not at the top of the file, line numbers
        // must reflect the actual file row, not the slice-local index.
        let lines = vec!["l0", "l1", "l2", "l3", "l4", "l5"];
        // Match at rows 3-4 (0-based): display_start = 2, display_end = 5.
        let region = Region::new(Point::new(3, 1), Point::new(4, 2));
        let display = collect_display_lines(&lines, &region);

        assert_eq!(display.len(), 4);

        // row 2 — context before: file line 3 (1-based)
        assert_eq!(display[0].line_number, 3);
        assert_eq!(display[0].code, "l2");
        assert_eq!(display[0].highlight, None);

        // row 3 — match start: file line 4
        assert_eq!(display[1].line_number, 4);
        assert_eq!(display[1].code, "l3");
        assert_eq!(display[1].highlight, Some(1..2));

        // row 4 — match end: file line 5
        assert_eq!(display[2].line_number, 5);
        assert_eq!(display[2].code, "l4");
        assert_eq!(display[2].highlight, Some(0..2));

        // row 5 — context after: file line 6
        assert_eq!(display[3].line_number, 6);
        assert_eq!(display[3].code, "l5");
        assert_eq!(display[3].highlight, None);
    }

    #[test]
    fn test_collect_display_lines_converts_byte_columns() {
        // tree-sitter reports columns in bytes. "é" is two bytes, so byte
        // column 4 is character index 3.
        let lines = vec!["aéb c"];
        let region = Region::new(Point::new(0, 1), Point::new(0, 4));
        let display = collect_display_lines(&lines, &region);

        assert_eq!(display[0].highlight, Some(1..3));
    }

    #[test]
    fn test_collect_display_lines_for_a_region_that_ends_at_the_end_of_file() {
        // `end_point` is exclusive, so the root node ends on the row after the
        // last line.
        let lines = vec!["l0", "l1"];
        let region = Region::new(Point::new(0, 0), Point::new(2, 0));
        let display = collect_display_lines(&lines, &region);

        assert_eq!(display.len(), 2);
        assert_eq!(display[1].line_number, 2);
        assert_eq!(display[1].highlight, Some(0..2));
    }

    #[test]
    fn test_format_wraps_multibyte_line_on_character_boundaries() {
        colored::control::set_override(false);
        let line = DisplayLine { line_number: 7, code: "héllo wörld", highlight: Some(2..8) };

        // 11 characters wrap into three rows of 4, each row 2 + 1 + 4 wide.
        assert_eq!(line.format(2, 4), vec![" 7 héll", " | o wö", " | rld "]);
    }

    #[test]
    fn test_tolerates_a_region_that_ends_before_it_starts() {
        colored::control::set_override(false);
        let lines = vec!["l0", "l1", "l2"];
        let region = Region::new(Point::new(2, 1), Point::new(1, 0));
        let display = collect_display_lines(&lines, &region);

        // The region collapses onto its end row, and nothing panics.
        assert_eq!(display.len(), 3);
        assert_eq!(display[1].line_number, 2);
        assert!(display[1].highlight.is_some());

        let backwards = Range { start: 4, end: 2 };
        let line = DisplayLine { line_number: 1, code: "abcdef", highlight: Some(backwards) };
        assert_eq!(line.format(1, 6), vec!["1 abcdef"]);
    }

    #[test]
    fn test_format_on_a_terminal_that_is_too_narrow() {
        colored::control::set_override(false);
        let line = DisplayLine { line_number: 1, code: "abcdef", highlight: Some(0..6) };

        // Side::new clamps code_width to 1, which must still make progress.
        assert_eq!(line.format(1, 1).len(), 6);
    }
}
