//! Classification of ignored fingerprint values.
//!
//! A fingerprint value is ignored when it occurs in the supplied template or
//! when it occurs in more than `max_file_count` distinct files.
//!
//! [`classify`] turns the input sequences into one packed bit-vector per file,
//! marking the positions those values occupy. Nothing ignored means no
//! bit-vector at all.

use crate::collections::vec_bitmap::VecBitmap;
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

/// Which fingerprint positions are ignored, one packed bit-vector per file.
///
/// Positions index a file's fingerprint array — not byte offsets, token
/// indices, rows, or columns.
pub struct IgnoredFingerprints {
    /// Bit `p` of item `f` is set when position `p` of file `f` is ignored;
    /// `None` when no position of any file is ignored.
    ignored_bitmap: Option<VecBitmap>,
}

impl IgnoredFingerprints {
    /// The number of ignored positions in `file`.
    pub fn ignored_count(&self, file: usize) -> usize {
        match self.ignored_bitmap.as_ref() {
            Some(mask) => mask.item(file).count_ones(),
            None => 0,
        }
    }

    /// Whether no position of any file is ignored.
    pub fn is_empty(&self) -> bool {
        self.ignored_bitmap.is_none()
    }

    /// The maximal ignore-free runs of `file` within `range`, in ascending
    /// order. Ignored positions act as barriers, so no run spans one.
    pub fn runs(
        &self,
        file: usize,
        range: Range<usize>,
    ) -> impl Iterator<Item = Range<usize>> + '_ {
        let Range { mut start, end } = range;

        std::iter::from_fn(move || {
            if start >= end {
                return None;
            }

            let run = match &self.ignored_bitmap {
                None => start..end,
                Some(mask) => {
                    let item = mask.item(file);
                    let start = item.next_zero_bit(start, end)?;
                    let end = item.next_one_bit(start, end).unwrap_or(end);
                    start..end
                }
            };

            start = run.end;
            Some(run)
        })
    }
}

/// Classify the ignored parts in the fingerprints of `sequences`.
///
/// * `sequences` — the fingerprint sequences of the files being compared.
/// * `template` — template fingerprint sequences; every fingerprint occurring in them
///   is ignored.
/// * `max_file_count` — a fingerprint occurring in strictly more than this many
///   distinct files is ignored. `None` disables the cap.
pub fn classify(
    sequences: &[Vec<Fingerprint>],
    template: &[Vec<Fingerprint>],
    max_file_count: Option<usize>,
) -> IgnoredFingerprints {
    let lengths: Vec<usize> = sequences.iter().map(Vec::len).collect();
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

    // Mark the ignored positions, allocating on the first one: a template
    // whose fingerprints never occur in the input leaves the mask unallocated.
    let mut mask: Option<VecBitmap> = None;
    for (file, sequence) in sequences.iter().enumerate() {
        for (position, fingerprint) in sequence.iter().enumerate() {
            if entries
                .get(fingerprint)
                .is_some_and(|entry| entry.is_ignored)
            {
                mask.get_or_insert_with(|| VecBitmap::new(&lengths))
                    .item_mut(file)
                    .mark(position, 1);
            }
        }
    }

    IgnoredFingerprints { ignored_bitmap: mask }
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
    fn marked(ignored: &IgnoredFingerprints, files: &[Vec<Fingerprint>]) -> Vec<Vec<usize>> {
        files
            .iter()
            .enumerate()
            .map(|(file, sequence)| ignored_positions(ignored, file, sequence.len()))
            .collect()
    }

    /// The ignored positions of `file`: the complement of its usable runs.
    fn ignored_positions(ignored: &IgnoredFingerprints, file: usize, length: usize) -> Vec<usize> {
        let mut usable = vec![false; length];
        for run in ignored.runs(file, 0..length) {
            usable[run].fill(true);
        }
        (0..length).filter(|&position| !usable[position]).collect()
    }

    // ── Document frequency ────────────────────────────────────────────

    #[test]
    fn a_fingerprint_in_at_most_max_files_is_kept() {
        let files = seqs(&["XA", "XB", "YC", "YD"]);
        let ignored = classify(&files, &[], Some(2));
        assert!(marked(&ignored, &files).iter().all(Vec::is_empty));
    }

    #[test]
    fn fingerprint_in_more_than_max_files_is_ignored() {
        let files = seqs(&["XA", "XB", "XC", "YD"]);
        let ignored = classify(&files, &[], Some(2));
        assert_eq!(
            marked(&ignored, &files),
            vec![vec![0], vec![0], vec![0], vec![]]
        );
    }

    // ── Template ───────────────────────────────────────────────────

    #[test]
    fn template_fingerprints_are_ignored() {
        // Z occurs in a single file, so no cap would ever catch it; repeats, in
        // the template and in the input alike, change nothing.
        let files = seqs(&["ZZA", "B"]);
        let ignored = classify(&files, &seqs(&["Z"]), None);
        assert_eq!(marked(&ignored, &files), vec![vec![0, 1], vec![]]);
    }

    #[test]
    fn a_template_that_matches_nothing_ignores_nothing() {
        let files = seqs(&["ABC", "ABC"]);
        let ignored = classify(&files, &seqs(&["Z"]), None);
        assert!(marked(&ignored, &files).iter().all(Vec::is_empty));
    }

    // ── Usable runs ───────────────────────────────────────────────────

    #[test]
    fn usable_runs_split_at_ignored_positions() {
        let files = seqs(&["ABXCDXX", "AB"]);
        let ignored = classify(&files, &seqs(&["X"]), None);

        let runs: Vec<Range<usize>> = ignored.runs(0, 0..7).collect();
        assert_eq!(runs, vec![0..2, 3..5]);
        // A range may start inside an ignored stretch and end inside a run.
        assert_eq!(ignored.runs(0, 2..4).collect::<Vec<_>>(), vec![3..4]);
        // A file without a single ignored position is one run.
        assert_eq!(ignored.runs(1, 0..2).collect::<Vec<_>>(), vec![0..2]);
    }

    #[test]
    fn without_a_mask_a_whole_range_is_one_usable_run() {
        let files = seqs(&["ABCDE"]);
        let ignored = classify(&files, &[], None);

        assert_eq!(ignored.runs(0, 1..4).collect::<Vec<_>>(), vec![1..4]);
        // An empty range yields no run at all.
        assert!(ignored.runs(0, 2..2).next().is_none());
    }

    // ── Shapes and accessors ──────────────────────────────────────────

    #[test]
    fn empty_sequences_produce_empty_masks() {
        let files = seqs(&["", "AB", ""]);
        let ignored = classify(&files, &seqs(&["A"]), None);

        assert_eq!(ignored.ignored_count(0), 0);
        assert_eq!(marked(&ignored, &files), vec![vec![], vec![0], vec![]]);
    }

    #[test]
    fn no_input_at_all_is_handled() {
        // A template without a single input file marks nothing.
        let ignored = classify(&[], &seqs(&["ABC"]), Some(1));
        assert!(marked(&ignored, &[]).is_empty());
    }

    #[test]
    fn padding_bits_of_the_last_word_are_not_counted() {
        // A file longer than one word, so the padding bits of the final word
        // would show up in the ignored count if they were ever written.
        let long: String = (0..100)
            .map(|i| if i % 7 == 0 { 'X' } else { 'a' })
            .collect();
        let files = seqs(&[&long]);
        let ignored = classify(&files, &seqs(&["X"]), None);

        let expected: Vec<usize> = (0..100).filter(|i| i % 7 == 0).collect();
        assert_eq!(marked(&ignored, &files), vec![expected.clone()]);
        assert_eq!(ignored.ignored_count(0), expected.len());
    }
}
