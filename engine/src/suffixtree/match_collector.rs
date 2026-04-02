use crate::collections::pair_array::PairArray;
use crate::collections::pair_bitmap::PairBitmap;
use crate::suffixtree::types::{AnalysisResult, Match, StartPosition, SymbolType};

/// Collects and processes matches found during tree traversal
pub struct MatchCollector<'a> {
    /// The words being compared.
    words: &'a [Vec<SymbolType>],
    /// Tracks the longest matching fragment length for each pair of words
    longest_fragments: PairArray<usize>,
    /// Bitmap tracking which positions have been covered by matches, per word pair
    overlap_bitmap: PairBitmap,
    /// Per-pair list of maximal exact matches (only when fragment storage is enabled).
    matches: Option<PairArray<Vec<Match>>>,
}

impl<'a> MatchCollector<'a> {
    /// Create a new `MatchCollector` for the given words.
    ///
    /// Initializes the longest-fragment tracker and overlap bitmap with sizes
    /// derived from the length of each word.
    pub fn new(words: &'a [Vec<SymbolType>], keep_fragments: bool) -> Self {
        let word_lengths: Vec<usize> = words.iter().map(|w| w.len()).collect();

        Self {
            words,
            longest_fragments: PairArray::new(words.len(), 0),
            overlap_bitmap: PairBitmap::new(word_lengths.as_slice()),
            matches: keep_fragments.then(|| PairArray::new(words.len(), Vec::new())),
        }
    }

    /// Record a maximal match between two positions.
    ///
    /// Computes the effective match length, trimming virtual end-of-word markers,
    /// updates the longest-fragment tracker, and marks the covered positions in
    /// the overlap bitmap so that overlapping matches are not double-counted.
    pub(crate) fn record_match(&mut self, sp1: &StartPosition, sp2: &StartPosition, length: usize) {
        let effective_length = self.calculate_effective_length(sp1, sp2, length);

        if effective_length == 0 {
            return;
        }

        self.update_longest_fragment(sp1.word_index, sp2.word_index, effective_length);
        self.overlap_bitmap.mark_pair(
            sp1.word_index,
            sp2.word_index,
            sp1.start,
            sp2.start,
            effective_length,
        );

        if let Some(m) = self.matches.as_mut() {
            m.get_mut(sp1.word_index, sp2.word_index).push(Match::new(
                sp1.clone(),
                sp2.clone(),
                effective_length,
            ));
        }
    }

    /// Calculate the effective length of a match.
    ///
    /// With sentinel-free edge lengths, reported depths already correspond to
    /// real token counts.
    #[inline]
    fn calculate_effective_length(
        &self,
        _sp1: &StartPosition,
        _sp2: &StartPosition,
        length: usize,
    ) -> usize {
        length
    }

    /// Update the longest fragment for a pair if the new length exceeds the current maximum.
    fn update_longest_fragment(&mut self, word1: usize, word2: usize, length: usize) {
        let current = self.longest_fragments.get_mut(word1, word2);
        if length > *current {
            *current = length;
        }
    }

    /// Consume the collector and build the final [`AnalysisResult`].
    ///
    /// Computes pairwise similarity scores from the overlap bitmap and packages
    /// them together with the longest-fragment results.
    pub(crate) fn into_result(self) -> AnalysisResult {
        let num_words = self.longest_fragments.size();
        let similarities = self.calculate_similarities(num_words);

        AnalysisResult {
            similarities,
            longest_fragments: self.longest_fragments,
            matches: self.matches,
        }
    }

    /// Calculate pairwise similarity scores for all word pairs.
    ///
    /// For each pair `(i1, i2)` the similarity is defined as:
    ///
    /// ```text
    /// similarity = total_overlap / (len(i1) + len(i2))
    /// ```
    ///
    /// where `total_overlap` is the number of positions covered by at least one
    /// shared match (as tracked by the overlap bitmap).
    fn calculate_similarities(&self, num_words: usize) -> PairArray<f64> {
        let mut similarities = PairArray::new(num_words, 0.0);

        for i1 in 0..num_words {
            for i2 in (i1 + 1)..num_words {
                let total_overlap = self.overlap_bitmap.count_ones_pair(i1, i2);
                let total_length = self.words[i1].len() + self.words[i2].len();

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
