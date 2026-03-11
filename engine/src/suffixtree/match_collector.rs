use crate::collections::pair_array::PairArray;
use crate::collections::pair_bitmap::PairBitmap;
use crate::report::AnalysisResult;
use crate::suffixtree::maximal_match::StartPosition;
use crate::suffixtree::types::SymbolType;

/// Collects and processes matches found during tree traversal
pub struct MatchCollector<'a> {
    /// The input sequences being compared
    inputs: &'a [Vec<SymbolType>],
    /// Tracks the longest matching fragment length for each pair of inputs
    longest_fragments: PairArray<usize>,
    /// Bitmap tracking which positions have been covered by matches, per input pair
    overlap_bitmap: PairBitmap,
}

impl<'a> MatchCollector<'a> {
    /// Create a new `MatchCollector` for the given input sequences.
    ///
    /// Initializes the longest-fragment tracker and overlap bitmap with sizes
    /// derived from the lengths of each input sequence.
    pub fn new(inputs: &'a [Vec<usize>]) -> Self {
        let input_lengths: Vec<usize> = inputs.iter().map(|i| i.len()).collect();

        Self {
            inputs,
            longest_fragments: PairArray::new(inputs.len(), 0),
            overlap_bitmap: PairBitmap::new(input_lengths.as_slice()),
        }
    }

    /// Record a maximal match between two positions.
    ///
    /// Computes the effective match length (trimming end-of-sequence markers),
    /// updates the longest-fragment tracker, and marks the covered positions in
    /// the overlap bitmap so that overlapping matches are not double-counted.
    pub(crate) fn record_match(&mut self, sp1: &StartPosition, sp2: &StartPosition, length: usize) {
        let effective_length = self.calculate_effective_length(sp1, sp2, length);

        if effective_length == 0 {
            return;
        }

        self.update_longest_fragment(sp1.input, sp2.input, effective_length);
        self.overlap_bitmap
            .mark_pair(sp1.input, sp2.input, sp1.start, sp2.start, effective_length);
    }

    /// Calculate the effective length of a match, excluding end markers.
    ///
    /// If the match reaches the end-of-sequence sentinel (`$`) of either input,
    /// the length is reduced by one so the sentinel is not counted as shared content.
    #[inline]
    fn calculate_effective_length(
        &self,
        sp1: &StartPosition,
        sp2: &StartPosition,
        length: usize,
    ) -> usize {
        let ends_at_marker = sp1.start + length >= self.inputs[sp1.input].len()
            || sp2.start + length >= self.inputs[sp2.input].len();

        if ends_at_marker {
            length.saturating_sub(1)
        } else {
            length
        }
    }

    /// Update the longest fragment for a pair if the new length exceeds the current maximum.
    fn update_longest_fragment(&mut self, input1: usize, input2: usize, length: usize) {
        let current = self.longest_fragments.get_mut(input1, input2);
        if length > *current {
            *current = length;
        }
    }

    /// Consume the collector and build the final [`AnalysisResult`].
    ///
    /// Computes pairwise similarity scores from the overlap bitmap and packages
    /// them together with the longest-fragment data.
    pub(crate) fn into_result(self) -> AnalysisResult {
        let num_inputs = self.longest_fragments.size();
        let similarities = self.calculate_similarities(num_inputs);

        AnalysisResult {
            similarities,
            longest_fragments: self.longest_fragments,
        }
    }

    /// Calculate pairwise similarity scores for all input pairs.
    ///
    /// For each pair `(i1, i2)` the similarity is defined as:
    ///
    /// ```text
    /// similarity = total_overlap / (len(i1) - 1 + len(i2) - 1)
    /// ```
    ///
    /// where `total_overlap` is the number of positions covered by at least one
    /// shared match (as tracked by the overlap bitmap), and the `-1` on each
    /// length accounts for the mandatory end-of-sequence sentinel (`$`).
    fn calculate_similarities(&self, num_inputs: usize) -> PairArray<f64> {
        let mut similarities = PairArray::new(num_inputs, 0.0);

        for i1 in 0..num_inputs {
            for i2 in (i1 + 1)..num_inputs {
                let total_overlap = self.overlap_bitmap.count_ones_pair(i1, i2);
                // Subtract 1 from each length to account for the end marker ($)
                let total_length = (self.inputs[i1].len() - 1) + (self.inputs[i2].len() - 1);

                let similarity = if total_length == 0 {
                    0.0
                } else {
                    total_overlap as f64 / total_length as f64
                };
                similarities.set(i1, i2, similarity);
            }
        }

        similarities
    }
}
