use crate::collections::utils::{ordered_pair, ordered_pair_with};

/// A flat bitmap for tracking per-pair bit coverage across N items.
///
/// Stores two bit-vectors per unordered pair (i, j), packed into a single
/// contiguous `Vec<u64>`. This avoids the overhead of individual heap
/// allocations per pair. Pair offsets are computed in O(1) from O(N)
/// precomputed metadata rather than storing O(N²) offsets.
///
/// # Layout
///
/// For each pair (i, j) where i < j, the storage contains:
///   - `ceil(lengths[i] / 64)` words for item i's coverage
///   - `ceil(lengths[j] / 64)` words for item j's coverage
///
/// Pairs are ordered row-major: (0,1), (0,2), ..., (0,N-1), (1,2), ..., (N-2,N-1).
pub struct PairBitmap {
    /// All bit data packed contiguously.
    words: Vec<u64>,
    /// `ceil(lengths[k] / 64)` for each item k.
    word_counts: Vec<usize>,
    /// `prefix_word_sums[k] = sum of word_counts[0..k]`.
    prefix_word_sums: Vec<usize>,
    /// `row_offsets[i]` = total words for all pairs in rows `0..i`.
    row_offsets: Vec<usize>,
}

impl PairBitmap {
    /// Creates a new `PairBitmap` for `lengths.len()` items, each with the
    /// given bit-length. All bits start as zero.
    pub fn new(lengths: &[usize]) -> Self {
        let size = lengths.len();

        let word_counts: Vec<usize> = lengths.iter().map(|&len| len.div_ceil(64)).collect();

        let mut prefix_word_sums = vec![0usize; size + 1];
        for i in 0..size {
            prefix_word_sums[i + 1] = prefix_word_sums[i] + word_counts[i];
        }

        let mut row_offsets = vec![0usize; size];
        let mut cumulative = 0usize;
        for a in 0..size {
            row_offsets[a] = cumulative;
            if a + 1 < size {
                let row_words = (size - 1 - a) * word_counts[a]
                    + (prefix_word_sums[size] - prefix_word_sums[a + 1]);
                cumulative += row_words;
            }
        }
        let total_words = cumulative;

        Self {
            words: vec![0u64; total_words],
            word_counts,
            prefix_word_sums,
            row_offsets,
        }
    }

    /// Convenience: mark both sides of a pair at once.
    ///
    /// Equivalent to calling `mark(i, j, i, start_i, len)` and
    /// `mark(i, j, j, start_j, len)`.
    pub fn mark_pair(&mut self, i: usize, j: usize, start_i: usize, start_j: usize, length: usize) {
        let (min, max, start_min, start_max) = ordered_pair_with(i, j, start_i, start_j);

        let base = self.pair_word_offset(min, max);
        let words1_count = self.word_counts[min];

        Self::fill_bit_range(&mut self.words, base, start_min, length);
        Self::fill_bit_range(&mut self.words, base + words1_count, start_max, length);
    }

    /// Count the number of set bits for item `item` in the pair `(i, j)`.
    pub fn count_ones(&self, i: usize, j: usize, item: usize) -> usize {
        debug_assert!(item == i || item == j);
        let (min, max) = ordered_pair(i, j);

        let base = self.pair_word_offset(min, max);
        let (offset, count) = if item == min {
            (base, self.word_counts[min])
        } else {
            (base + self.word_counts[min], self.word_counts[max])
        };

        Self::popcount(&self.words[offset..offset + count])
    }

    /// Count the total number of set bits across both items in a pair.
    pub fn count_ones_pair(&self, i: usize, j: usize) -> usize {
        let (min, max) = ordered_pair(i, j);
        let base = self.pair_word_offset(min, max);
        let total_words = self.word_counts[min] + self.word_counts[max];

        Self::popcount(&self.words[base..(base + total_words)])
    }

    // ── private helpers ──────────────────────────────────────────────

    /// Compute the word offset for pair (i, j) where i < j in O(1).
    #[inline]
    fn pair_word_offset(&self, i: usize, j: usize) -> usize {
        debug_assert!(i < j);
        self.row_offsets[i]
            + (j - i - 1) * self.word_counts[i]
            + (self.prefix_word_sums[j] - self.prefix_word_sums[i + 1])
    }

    /// Count set bits in a word slice.
    #[inline]
    fn popcount(words: &[u64]) -> usize {
        words.iter().map(|&w| w.count_ones() as usize).sum()
    }

    /// Set bits `[start, start + length)` in the flat word buffer starting at
    /// `word_base`.
    fn fill_bit_range(words: &mut [u64], word_base: usize, start: usize, length: usize) {
        if length == 0 {
            return;
        }

        let end = start + length;
        let first_word = start / 64;
        let last_word = (end - 1) / 64;
        let start_bit = start % 64;

        if first_word == last_word {
            let end_bit = end - first_word * 64;
            let mask = Self::mask_range(start_bit, end_bit);
            words[word_base + first_word] |= mask;
        } else {
            // First partial word: set bits [start_bit, 64)
            words[word_base + first_word] |= !0u64 << start_bit;

            // Full middle words
            words[(word_base + first_word + 1)..(word_base + last_word)].fill(!0u64);

            // Last partial word: set bits [0, end_bit)
            let end_bit = end % 64;
            if end_bit == 0 {
                words[word_base + last_word] = !0u64;
            } else {
                words[word_base + last_word] |= (1u64 << end_bit) - 1;
            }
        }
    }

    /// Create a bitmask for bits `[low, high)` within a single u64 word.
    #[inline]
    fn mask_range(low: usize, high: usize) -> u64 {
        let upper = if high >= 64 {
            !0u64
        } else {
            (1u64 << high) - 1
        };
        upper & (!0u64 << low)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_single_pair() {
        let mut bm = PairBitmap::new(&[10, 8]);
        bm.mark_pair(0, 1, 2, 3, 4);

        // item 0: bits 2..6 set → 4 ones
        assert_eq!(bm.count_ones(0, 1, 0), 4);
        // item 1: bits 3..7 set → 4 ones
        assert_eq!(bm.count_ones(0, 1, 1), 4);
        assert_eq!(bm.count_ones_pair(0, 1), 8);
    }

    #[test]
    fn test_multiple_marks_union() {
        let mut bm = PairBitmap::new(&[20, 20]);
        bm.mark_pair(0, 1, 0, 0, 5);
        bm.mark_pair(0, 1, 3, 3, 5); // overlaps [3,5) with the first mark

        // Union of [0,5) and [3,8) = [0,8) → 8 ones
        assert_eq!(bm.count_ones(0, 1, 0), 8);
        assert_eq!(bm.count_ones(0, 1, 1), 8);
    }

    #[test]
    fn test_three_items() {
        let mut bm = PairBitmap::new(&[100, 200, 150]);

        bm.mark_pair(0, 1, 10, 20, 30);
        bm.mark_pair(0, 2, 50, 60, 10);
        bm.mark_pair(1, 2, 0, 0, 5);

        assert_eq!(bm.count_ones(0, 1, 0), 30);
        assert_eq!(bm.count_ones(0, 1, 1), 30);
        assert_eq!(bm.count_ones(0, 2, 0), 10);
        assert_eq!(bm.count_ones(0, 2, 2), 10);
        assert_eq!(bm.count_ones(1, 2, 1), 5);
        assert_eq!(bm.count_ones(1, 2, 2), 5);
    }

    #[test]
    fn test_cross_word_boundary() {
        // Length > 64 to force multiple u64 words
        let mut bm = PairBitmap::new(&[128, 128]);
        bm.mark_pair(0, 1, 60, 60, 10); // crosses the 64-bit boundary

        assert_eq!(bm.count_ones(0, 1, 0), 10);
        assert_eq!(bm.count_ones(0, 1, 1), 10);
    }

    #[test]
    fn test_empty_mark() {
        let mut bm = PairBitmap::new(&[10, 10]);
        bm.mark_pair(0, 1, 0, 0, 0);
        assert_eq!(bm.count_ones_pair(0, 1), 0);
    }

    #[test]
    fn test_reversed_pair_order() {
        let mut bm = PairBitmap::new(&[10, 10]);
        // Pass pair in reversed order (1, 0) instead of (0, 1)
        bm.mark_pair(1, 0, 2, 3, 4);

        // Should still work correctly
        assert_eq!(bm.count_ones(0, 1, 0), 4);
        assert_eq!(bm.count_ones(0, 1, 1), 4);
    }
}
