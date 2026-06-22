use crate::collections::pair_array::PairArray;
use crate::collections::pair_bitmap::PairBitmap;
use crate::collections::utils::ordered_pair_with;
use crate::collections::vec_bitmap::VecBitmap;
use crate::suffixtree::types::{AnalysisResult, Match, PairMetrics, StartPosition, SymbolType};

/// Collects and processes matches found during tree traversal.
pub struct MatchCollector<'a> {
    /// The sequences being compared.
    sequences: &'a [Vec<SymbolType>],
    /// Tracks the longest matching fragment length for each pair of sequences.
    longest_fragments: PairArray<usize>,
    /// Bitmap tracking which positions have been covered by matches, per sequence pair.
    overlap_bitmap: PairBitmap,
    /// Bitmap tracking which positions belong to ignored substrings, per sequence.
    ///
    /// Only present when `exclude_ignored` is `true`. Used in [`build_metrics`]
    /// to subtract ignored positions from totals and to mask the overlap counts.
    ignore_bitmap: Option<VecBitmap>,
    /// Per-pair list of maximal exact matches (only when fragment storage is enabled).
    matches: Option<PairArray<Vec<Match>>>,
}

impl<'a> MatchCollector<'a> {
    /// Create a new `MatchCollector` for the given sequences.
    ///
    /// Initializes the longest-fragment tracker and overlap bitmap with sizes
    /// derived from the length of each sequence.
    pub fn new(
        sequences: &'a [Vec<SymbolType>],
        keep_fragments: bool,
        exclude_ignored: bool,
    ) -> Self {
        let sequence_lengths: Vec<usize> = sequences.iter().map(|s| s.len()).collect();

        Self {
            sequences,
            longest_fragments: PairArray::new(sequences.len(), 0),
            overlap_bitmap: PairBitmap::new(sequence_lengths.as_slice()),
            ignore_bitmap: exclude_ignored.then(|| VecBitmap::new(sequence_lengths.as_slice())),
            matches: keep_fragments.then(|| PairArray::new(sequences.len(), Vec::new())),
        }
    }

    /// Record a maximal match between two positions.
    ///
    /// Marks the covered positions in the overlap bitmap so overlapping matches
    /// are not double-counted, and stores the match when fragment storage is
    /// enabled. When `is_ignored` is `false` the longest-fragment tracker is
    /// updated; ignored matches are excluded from that metric.
    pub(crate) fn record_match(
        &mut self,
        sp1: &StartPosition,
        sp2: &StartPosition,
        length: usize,
        is_ignored: bool,
    ) {
        if length == 0 {
            return;
        }

        if !is_ignored {
            self.update_longest_fragment(sp1.sequence_index, sp2.sequence_index, length);
        }
        self.overlap_bitmap.mark_pair(
            sp1.sequence_index,
            sp2.sequence_index,
            sp1.start,
            sp2.start,
            length,
        );

        if let Some(m) = self.matches.as_mut() {
            let (_, _, left_start, right_start) =
                ordered_pair_with(sp1.sequence_index, sp2.sequence_index, sp1.start, sp2.start);
            m.get_mut(sp1.sequence_index, sp2.sequence_index)
                .push(Match { left_start, right_start, length, ignored: is_ignored });
        }
    }

    /// Mark the positions covered by an ignored substring in the ignore bitmap.
    ///
    /// This is called for every position under an ignored tree node so that
    /// [`build_metrics`] can subtract them from the total and overlap counts.
    pub(crate) fn record_ignore_match(&mut self, sp: &StartPosition, length: usize) {
        self.ignore_bitmap
            .as_mut()
            .expect("ignore tracking not enabled")
            .mark(sp.sequence_index, sp.start, length);
    }

    /// Update the longest fragment for a pair if the new length exceeds the current maximum.
    fn update_longest_fragment(&mut self, seq1: usize, seq2: usize, length: usize) {
        let current = self.longest_fragments.get_mut(seq1, seq2);
        if length > *current {
            *current = length;
        }
    }

    /// Consume the collector and build the final [`AnalysisResult`].
    pub(crate) fn into_result(self) -> AnalysisResult {
        AnalysisResult { metrics: self.build_metrics(), matches: self.matches }
    }

    /// Compute coverage counts for a single sequence pair `(i1, i2)`.
    ///
    /// Returns `(total_left, total_right, overlap_left, overlap_right)`.
    /// When an ignore bitmap is present, ignored positions are subtracted from
    /// totals and masked out of the overlap counts.
    fn pair_coverage(&self, i1: usize, i2: usize) -> (usize, usize, usize, usize) {
        if let Some(ignore) = &self.ignore_bitmap {
            (
                self.sequences[i1].len() - ignore.count_ones(i1),
                self.sequences[i2].len() - ignore.count_ones(i2),
                (self.overlap_bitmap.words_for(i1, i2, i1) & !ignore.words_for(i1)).count_ones(),
                (self.overlap_bitmap.words_for(i1, i2, i2) & !ignore.words_for(i2)).count_ones(),
            )
        } else {
            (
                self.sequences[i1].len(),
                self.sequences[i2].len(),
                self.overlap_bitmap.count_ones(i1, i2, i1),
                self.overlap_bitmap.count_ones(i1, i2, i2),
            )
        }
    }

    /// Build per-pair [`PairMetrics`] for all sequence pairs.
    ///
    /// For each pair `(i1, i2)` the similarity is defined as:
    ///
    /// ```text
    /// similarity = (overlap_left + overlap_right) / (total_left + total_right)
    /// ```
    ///
    /// Where the overlaps are the number of positions covered by at least one
    /// shared match.
    fn build_metrics(&self) -> PairArray<PairMetrics> {
        let mut metrics = PairArray::new(self.sequences.len(), PairMetrics::default());

        for i1 in 0..self.sequences.len() {
            for i2 in (i1 + 1)..self.sequences.len() {
                let (total_left, total_right, overlap_left, overlap_right) =
                    self.pair_coverage(i1, i2);

                let total_overlap = overlap_left + overlap_right;
                let total_length = total_left + total_right;

                let similarity = if total_length == 0 {
                    0.0
                } else {
                    total_overlap as f64 / total_length as f64
                };

                metrics.set(
                    i1,
                    i2,
                    PairMetrics {
                        similarity,
                        total_left,
                        total_right,
                        overlap_left,
                        overlap_right,
                        longest_fragment: *self.longest_fragments.get(i1, i2),
                    },
                );
            }
        }

        metrics
    }
}
