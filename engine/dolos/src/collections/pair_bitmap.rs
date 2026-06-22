use crate::collections::bit_vec::BitVec;
use crate::collections::utils::{ordered_pair, ordered_pair_with};
use crate::collections::word_slice::WordSlice;

/// A flat bitmap for tracking per-pair bit coverage across N items.
///
/// Stores two bit-vectors per unordered pair (i, j), packed into a single
/// contiguous [`BitVec`]. This avoids the overhead of individual heap
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
    /// Underlying packed bit storage.
    buf: BitVec,
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

        Self {
            buf: BitVec::new(cumulative),
            word_counts,
            prefix_word_sums,
            row_offsets,
        }
    }

    /// Mark both sides of a pair at once.
    ///
    /// Sets bits `[start_i, start_i + length)` for item `i` and
    /// `[start_j, start_j + length)` for item `j` in the pair `(i, j)`.
    pub fn mark_pair(&mut self, i: usize, j: usize, start_i: usize, start_j: usize, length: usize) {
        let (min, max, start_min, start_max) = ordered_pair_with(i, j, start_i, start_j);
        let base = self.pair_word_offset(min, max);
        self.buf.mark(base, start_min, length);
        self.buf
            .mark(base + self.word_counts[min], start_max, length);
    }

    /// Count the number of set bits for item `item` in the pair `(i, j)`.
    pub fn count_ones(&self, i: usize, j: usize, item: usize) -> usize {
        let (word_base, word_count) = self.item_word_range(i, j, item);
        self.buf.count_ones(word_base, word_count)
    }

    /// Count the total number of set bits across both items in a pair.
    pub fn count_ones_pair(&self, i: usize, j: usize) -> usize {
        let (min, max) = ordered_pair(i, j);
        let base = self.pair_word_offset(min, max);
        let total_words = self.word_counts[min] + self.word_counts[max];

        self.buf.count_ones(base, total_words)
    }

    /// Return a [`WordSlice`] view over the packed `u64` words for `item`
    /// within the pair `(i, j)`.
    pub fn words_for(&self, i: usize, j: usize, item: usize) -> WordSlice<'_> {
        let (word_base, word_count) = self.item_word_range(i, j, item);
        self.buf.words_slice(word_base, word_count)
    }

    // ── private helpers ──────────────────────────────────────────────

    /// Return the `(word_base, word_count)` for `item` within the pair `(i, j)`.
    fn item_word_range(&self, i: usize, j: usize, item: usize) -> (usize, usize) {
        debug_assert!(item == i || item == j);
        let (min, max) = ordered_pair(i, j);
        let base = self.pair_word_offset(min, max);
        if item == min {
            (base, self.word_counts[min])
        } else {
            (base + self.word_counts[min], self.word_counts[max])
        }
    }

    /// Compute the word offset for pair (i, j) in O(1), where i < j.
    #[inline]
    fn pair_word_offset(&self, i: usize, j: usize) -> usize {
        debug_assert!(i < j);
        self.row_offsets[i]
            + (j - i - 1) * self.word_counts[i]
            + (self.prefix_word_sums[j] - self.prefix_word_sums[i + 1])
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
        bm.mark_pair(1, 0, 2, 3, 4);

        assert_eq!(bm.count_ones(0, 1, 0), 4);
        assert_eq!(bm.count_ones(0, 1, 1), 4);
    }
}
