//! Classification of ignored fingerprint values.
//!
//! A fingerprint value is ignored when it occurs in the supplied template or
//! when it occurs in more than `max_file_count` distinct files. [`classify`]
//! turns that into the positions each file's fingerprint array loses.

use crate::winnowing::fingerprints::Fingerprint;
use std::collections::HashMap;
use std::ops::Range;

/// Per-fingerprint statistics gathered while classifying.
#[derive(Default)]
struct Entry {
    /// `file + 1` of the most recent file this value was counted for, or `0`
    /// when it has not been counted yet.
    last_seen: usize,
    /// Number of distinct files containing this value.
    file_count: usize,
    /// The value occurs in the template or in more files than the cap allows.
    is_ignored: bool,
}

/// Classify the ignored parts in the fingerprints of `sequences`.
///
/// * `sequences` — the fingerprint sequences of the files being compared.
/// * `template` — template fingerprint sequences; every fingerprint occurring
///   in them is ignored.
/// * `max_file_count` — a fingerprint occurring in strictly more than this many
///   distinct files is ignored. `None` disables the cap.
pub fn classify(
    sequences: &[Vec<Fingerprint>],
    template: &[Vec<Fingerprint>],
    max_file_count: Option<usize>,
) -> Vec<Vec<Range<usize>>> {
    let mut entries: HashMap<Fingerprint, Entry> = HashMap::new();

    // insert template entries
    for &template_fingerprint in template.iter().flatten() {
        entries.entry(template_fingerprint).or_default().is_ignored = true;
    }

    // Count the number of distinct files each fingerprint occurs in if a cap is given.
    if let Some(max) = max_file_count {
        for (file, sequence) in sequences.iter().enumerate() {
            // `file + 1` keeps `0` free as "not counted yet"
            let stamp = file + 1;
            for &fingerprint in sequence {
                let entry = entries.entry(fingerprint).or_default();
                if entry.last_seen != stamp {
                    entry.last_seen = stamp;
                    entry.file_count += 1;
                    entry.is_ignored |= entry.file_count > max;
                }
            }
        }
    }

    sequences
        .iter()
        .map(|sequence| ignored_ranges(sequence, &entries))
        .collect()
}

/// The maximal ranges of `sequence` whose fingerprints are ignored.
fn ignored_ranges(
    sequence: &[Fingerprint],
    entries: &HashMap<Fingerprint, Entry>,
) -> Vec<Range<usize>> {
    let mut ranges: Vec<Range<usize>> = Vec::new();

    for (position, fingerprint) in sequence.iter().enumerate() {
        if entries
            .get(fingerprint)
            .is_some_and(|entry| entry.is_ignored)
        {
            // Extend the previous range when this position continues it.
            match ranges.last_mut() {
                Some(last) if last.end == position => last.end = position + 1,
                _ => ranges.push(position..position + 1),
            }
        }
    }

    ranges
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Build fingerprint sequences from strings, one byte per fingerprint.
    fn seqs(sequences: &[&str]) -> Vec<Vec<Fingerprint>> {
        sequences
            .iter()
            .map(|s| s.bytes().map(|b| b as Fingerprint).collect())
            .collect()
    }

    /// The ignored positions of every file, as a plain nested `Vec`.
    fn marked(ignored: Vec<Vec<Range<usize>>>) -> Vec<Vec<usize>> {
        ignored
            .iter()
            .map(|ranges| ranges.iter().flat_map(Clone::clone).collect())
            .collect()
    }

    // ── Document frequency ────────────────────────────────────────────

    #[test]
    fn a_fingerprint_in_at_most_max_files_is_kept() {
        let files = seqs(&["XA", "XB", "YC", "YD"]);
        let ignored = classify(&files, &[], Some(2));
        assert!(marked(ignored).iter().all(Vec::is_empty));
    }

    #[test]
    fn a_fingerprint_in_more_than_max_files_is_ignored() {
        let files = seqs(&["XA", "XB", "XC", "YD"]);
        let ignored = classify(&files, &[], Some(2));
        assert_eq!(marked(ignored), vec![vec![0], vec![0], vec![0], vec![]]);
    }

    // ── Template ───────────────────────────────────────────────────

    #[test]
    fn template_fingerprints_are_ignored() {
        // Z occurs in a single file, so no cap would ever catch it; repeats, in
        // the template and in the input alike, change nothing.
        let files = seqs(&["ZZA", "B"]);
        let ignored = classify(&files, &seqs(&["Z"]), None);
        assert_eq!(marked(ignored), vec![vec![0, 1], vec![]]);
    }

    #[test]
    fn a_template_that_matches_nothing_ignores_nothing() {
        let files = seqs(&["ABC", "ABC"]);
        let ignored = classify(&files, &seqs(&["Z"]), None);
        assert!(marked(ignored).iter().all(Vec::is_empty));
    }

    // ── Shapes ────────────────────────────────────────────────────────

    /// Adjacent ignored positions become one range, separated ones do not.
    #[test]
    fn ignored_positions_are_merged_into_maximal_ranges() {
        let files = seqs(&["ABXXCDX", "AB"]);
        let ignored = classify(&files, &seqs(&["X"]), None);
        assert_eq!(ignored[0], [2..4, 6..7]);
    }

    #[test]
    fn empty_sequences_are_handled() {
        let files = seqs(&["", "AB", ""]);
        let ignored = classify(&files, &seqs(&["A"]), None);
        assert_eq!(marked(ignored), vec![vec![], vec![0], vec![]]);
    }

    #[test]
    fn no_input_at_all_is_handled() {
        // A template without a single input file marks nothing.
        let ignored = classify(&[], &seqs(&["ABC"]), Some(1));
        assert!(ignored.is_empty());
    }
}
