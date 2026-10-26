use crate::Symbol;
use crate::collections::pair_array::PairArray;
use crate::collections::pair_bitmap::PairBitmap;
use crate::collections::utils::ordered_pair_with;
use crate::collections::vec_bitmap::VecBitmap;
use crate::suffixtree::types::{AnalysisResult, Match, PairMetrics, StartPosition};

/// Collects and processes matches found during tree traversal.
pub struct MatchCollector<'a> {
    /// The sequences being compared.
    sequences: &'a [Vec<Symbol>],
    /// The set bits mark the ignored positions of each sequence. `None`
    /// ignores nothing.
    ignore_mask: Option<&'a VecBitmap>,
    /// Tracks the longest match length for each pair of sequences.
    longest_matches: PairArray<usize>,
    /// Bitmap tracking which positions have been covered by matches, per sequence pair.
    overlap_bitmap: PairBitmap,
    /// Per-pair list of maximal exact matches (only when they are kept).
    matches: Option<PairArray<Vec<Match>>>,
    /// Shortest run worth recording.
    min_match_length: usize,
}

impl<'a> MatchCollector<'a> {
    /// Create a new `MatchCollector` for the given sequences.
    ///
    /// Initializes the longest-match tracker and overlap bitmap with sizes
    /// derived from the length of each sequence.
    pub fn new(
        sequences: &'a [Vec<Symbol>],
        ignore_mask: Option<&'a VecBitmap>,
        min_match_length: usize,
        keep_matches: bool,
    ) -> Self {
        let sequence_lengths: Vec<usize> = sequences.iter().map(|s| s.len()).collect();

        Self {
            sequences,
            ignore_mask,
            longest_matches: PairArray::new(sequences.len(), 0),
            overlap_bitmap: PairBitmap::new(sequence_lengths.as_slice()),
            matches: keep_matches.then(|| PairArray::new(sequences.len(), Vec::new())),
            min_match_length,
        }
    }

    /// Record a maximal match, split at ignored positions.
    ///
    /// The match is cut into its maximal ignore-free runs and each run is
    /// recorded separately. Ignored positions act as barriers, never as
    /// deletions.
    pub fn record_match(&mut self, sp1: &StartPosition, sp2: &StartPosition, length: usize) {
        // Nothing is ignored, so the match is already a single usable run.
        let Some(ignored) = self.ignore_mask else {
            self.record_run(sp1, sp2, length);
            return;
        };

        // Both sequences are walked: the caller may ignore different positions
        // in each one, so a run is usable only where neither side is ignored.
        for run in ignored.shared_runs(
            sp1.sequence_index,
            sp1.start,
            sp2.sequence_index,
            sp2.start,
            length,
            false,
        ) {
            self.record_run(&sp1.shifted(run.start), &sp2.shifted(run.start), run.len());
        }
    }

    /// Record one ignore-free run of a match.
    ///
    /// Runs shorter than `min_match_length` are dropped.
    fn record_run(&mut self, sp1: &StartPosition, sp2: &StartPosition, length: usize) {
        if length < self.min_match_length {
            return;
        }

        let (seq1, seq2) = (sp1.sequence_index, sp2.sequence_index);
        self.update_longest_match(seq1, seq2, length);
        self.overlap_bitmap
            .mark_pair(seq1, seq2, sp1.start, sp2.start, length);

        if let Some(m) = self.matches.as_mut() {
            let (_, _, left_start, right_start) =
                ordered_pair_with(seq1, seq2, sp1.start, sp2.start);
            m.get_mut(seq1, seq2)
                .push(Match { left_start, right_start, length });
        }
    }

    /// Update the longest match of a pair if the new length exceeds the current maximum.
    fn update_longest_match(&mut self, seq1: usize, seq2: usize, length: usize) {
        let current = self.longest_matches.get_mut(seq1, seq2);
        if length > *current {
            *current = length;
        }
    }

    /// Consume the collector and build the final [`AnalysisResult`].
    pub fn into_result(self) -> AnalysisResult {
        AnalysisResult { metrics: self.build_metrics(), matches: self.matches }
    }

    /// Build per-pair [`PairMetrics`] for all sequence pairs.
    ///
    /// For each pair `(i, j)` the similarity is defined as:
    ///
    /// ```text
    /// similarity = (overlap_left + overlap_right) / (total_left + total_right)
    /// ```
    ///
    /// Where the overlaps are the number of positions covered by at least one
    /// shared match, and the totals exclude ignored positions.
    fn build_metrics(&self) -> PairArray<PairMetrics> {
        let mut metrics = PairArray::new(self.sequences.len(), PairMetrics::default());
        let totals: Vec<usize> = self
            .sequences
            .iter()
            .enumerate()
            .map(|(seq, sequence)| {
                sequence.len()
                    - self
                        .ignore_mask
                        .map_or(0, |ignored| ignored.item(seq).count_ones())
            })
            .collect();

        for i in 0..self.sequences.len() {
            for j in (i + 1)..self.sequences.len() {
                let (total_left, total_right) = (totals[i], totals[j]);
                let overlap_left = self.overlap_bitmap.item(i, j, i).count_ones();
                let overlap_right = self.overlap_bitmap.item(i, j, j).count_ones();

                let total_overlap = overlap_left + overlap_right;
                let total_length = total_left + total_right;

                let similarity = if total_length == 0 {
                    0.0
                } else {
                    total_overlap as f64 / total_length as f64
                };

                metrics.set(
                    i,
                    j,
                    PairMetrics {
                        similarity,
                        total_left,
                        total_right,
                        overlap_left,
                        overlap_right,
                        longest_match: *self.longest_matches.get(i, j),
                    },
                );
            }
        }

        metrics
    }
}
