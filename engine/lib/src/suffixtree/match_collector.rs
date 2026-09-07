use crate::collections::pair_array::PairArray;
use crate::collections::pair_bitmap::PairBitmap;
use crate::collections::utils::ordered_pair_with;
use crate::suffixtree::types::{AnalysisResult, Match, PairMetrics, StartPosition, SymbolType};

/// Collects and processes matches found during tree traversal.
pub struct MatchCollector<'a> {
    /// The sequences being compared.
    sequences: &'a [Vec<SymbolType>],
    /// Tracks the longest matching fragment length for each pair of sequences.
    longest_fragments: PairArray<usize>,
    /// Bitmap tracking which positions have been covered by matches, per sequence pair.
    overlap_bitmap: PairBitmap,
    /// Per-pair list of maximal exact matches (only when fragment storage is enabled).
    matches: Option<PairArray<Vec<Match>>>,
}

impl<'a> MatchCollector<'a> {
    /// Create a new `MatchCollector` for the given sequences.
    ///
    /// Initializes the longest-fragment tracker and overlap bitmap with sizes
    /// derived from the length of each sequence.
    pub fn new(sequences: &'a [Vec<SymbolType>], keep_fragments: bool) -> Self {
        let sequence_lengths: Vec<usize> = sequences.iter().map(|s| s.len()).collect();

        Self {
            sequences,
            longest_fragments: PairArray::new(sequences.len(), 0),
            overlap_bitmap: PairBitmap::new(sequence_lengths.as_slice()),
            matches: keep_fragments.then(|| PairArray::new(sequences.len(), Vec::new())),
        }
    }

    /// Record a maximal match between two positions.
    ///
    /// Marks the covered positions in the overlap bitmap so overlapping matches
    /// are not double-counted, updates the longest-fragment tracker, and stores
    /// the match when fragment storage is enabled.
    pub fn record_match(&mut self, sp1: &StartPosition, sp2: &StartPosition, length: usize) {
        if length == 0 {
            return;
        }

        self.update_longest_fragment(sp1.sequence_index, sp2.sequence_index, length);
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
                .push(Match { left_start, right_start, length });
        }
    }

    /// Update the longest fragment for a pair if the new length exceeds the current maximum.
    fn update_longest_fragment(&mut self, seq1: usize, seq2: usize, length: usize) {
        let current = self.longest_fragments.get_mut(seq1, seq2);
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
                let total_left = self.sequences[i1].len();
                let total_right = self.sequences[i2].len();
                let overlap_left = self.overlap_bitmap.count_ones(i1, i2, i1);
                let overlap_right = self.overlap_bitmap.count_ones(i1, i2, i2);

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
