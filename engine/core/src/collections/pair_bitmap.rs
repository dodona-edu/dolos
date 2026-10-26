use crate::collections::bit_region::BitRegion;
use crate::collections::bit_vec::BitVec;
use crate::collections::utils::{ordered_pair, ordered_pair_with};

/// A flat bitmap for tracking per-pair bit coverage across N items.
///
/// Stores two bit-vectors per unordered pair (i, j), packed into a single
/// contiguous [`BitVec`]. This avoids the overhead of individual heap
/// allocations per pair. Pair offsets are computed in O(1) from O(N)
/// precomputed metadata rather than storing O(N²) offsets. Reading and writing
/// bits happens through the [`BitRegion`] an item of a pair resolves to.
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
    /// Bit length of each item.
    lengths: Vec<usize>,
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
        let item_count = lengths.len();

        let word_counts: Vec<usize> = lengths.iter().map(|&length| length.div_ceil(64)).collect();

        let mut prefix_word_sums = vec![0usize; item_count + 1];
        for i in 0..item_count {
            prefix_word_sums[i + 1] = prefix_word_sums[i] + word_counts[i];
        }

        let mut row_offsets = vec![0usize; item_count];
        let mut cumulative = 0usize;
        for a in 0..item_count {
            row_offsets[a] = cumulative;
            if a + 1 < item_count {
                let row_words = (item_count - 1 - a) * word_counts[a]
                    + (prefix_word_sums[item_count] - prefix_word_sums[a + 1]);
                cumulative += row_words;
            }
        }

        Self {
            buf: BitVec::new(cumulative),
            lengths: lengths.to_vec(),
            word_counts,
            prefix_word_sums,
            row_offsets,
        }
    }

    /// The number of items.
    pub fn item_count(&self) -> usize {
        self.lengths.len()
    }

    /// Whether the bitmap holds no items at all.
    pub fn is_empty(&self) -> bool {
        self.lengths.is_empty()
    }

    /// The bit-vector of `item` within the pair `(i, j)`.
    pub fn item(&self, i: usize, j: usize, item: usize) -> BitRegion<'_> {
        self.buf
            .region(self.item_word_base(i, j, item), self.lengths[item])
    }

    /// Mark both items of a pair at once.
    ///
    /// Sets bits `[start_i, start_i + length)` for item `i` and
    /// `[start_j, start_j + length)` for item `j` in the pair `(i, j)`.
    #[inline]
    pub fn mark_pair(&mut self, i: usize, j: usize, start_i: usize, start_j: usize, length: usize) {
        let (min, max, start_min, start_max) = ordered_pair_with(i, j, start_i, start_j);
        let word_base = self.pair_word_base(min, max);
        self.buf
            .region_mut(word_base, self.lengths[min])
            .mark(start_min, length);
        self.buf
            .region_mut(word_base + self.word_counts[min], self.lengths[max])
            .mark(start_max, length);
    }

    // ── private helpers ──────────────────────────────────────────────

    /// The word at which `item`'s bit-vector within the pair `(i, j)` begins.
    #[inline]
    fn item_word_base(&self, i: usize, j: usize, item: usize) -> usize {
        debug_assert!(item == i || item == j);
        let (min, max) = ordered_pair(i, j);
        let word_base = self.pair_word_base(min, max);
        if item == min {
            word_base
        } else {
            word_base + self.word_counts[min]
        }
    }

    /// Compute the word base for pair (i, j) in O(1), where i < j.
    #[inline]
    fn pair_word_base(&self, i: usize, j: usize) -> usize {
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
    fn both_items_of_a_pair_are_marked() {
        let mut bm = PairBitmap::new(&[10, 8]);
        bm.mark_pair(0, 1, 2, 3, 4);

        assert_eq!(
            bm.item(0, 1, 0).iter_ones().collect::<Vec<_>>(),
            [2, 3, 4, 5]
        );
        assert_eq!(
            bm.item(0, 1, 1).iter_ones().collect::<Vec<_>>(),
            [3, 4, 5, 6]
        );
        // Each item keeps its own length.
        assert_eq!(bm.item(0, 1, 0).len(), 10);
        assert_eq!(bm.item(0, 1, 1).len(), 8);
    }

    #[test]
    fn overlapping_marks_are_a_union() {
        let mut bm = PairBitmap::new(&[20, 20]);
        bm.mark_pair(0, 1, 0, 0, 5);
        bm.mark_pair(0, 1, 3, 3, 5); // overlaps [3,5) with the first mark

        // Union of [0,5) and [3,8) = [0,8)
        assert_eq!(bm.item(0, 1, 0).count_ones(), 8);
        assert_eq!(bm.item(0, 1, 1).count_ones(), 8);
    }

    #[test]
    fn pairs_of_three_items_do_not_share_storage() {
        let mut bm = PairBitmap::new(&[100, 200, 150]);
        assert_eq!(bm.item_count(), 3);

        bm.mark_pair(0, 1, 10, 20, 30);
        bm.mark_pair(0, 2, 50, 60, 10);
        bm.mark_pair(1, 2, 0, 0, 5);

        assert_eq!(bm.item(0, 1, 0).count_ones(), 30);
        assert_eq!(bm.item(0, 1, 1).count_ones(), 30);
        assert_eq!(bm.item(0, 2, 0).count_ones(), 10);
        assert_eq!(bm.item(0, 2, 2).count_ones(), 10);
        assert_eq!(bm.item(1, 2, 1).count_ones(), 5);
        assert_eq!(bm.item(1, 2, 2).count_ones(), 5);
        // Item 0 is untouched in the pair it does not take part in.
        assert_eq!(bm.item(1, 2, 2).next_one_bit(5, 150), None);
    }

    #[test]
    fn a_mark_may_cross_a_word_boundary() {
        let mut bm = PairBitmap::new(&[128, 128]);
        bm.mark_pair(0, 1, 60, 60, 10);

        assert_eq!(bm.item(0, 1, 0).count_ones(), 10);
        assert_eq!(bm.item(0, 1, 1).count_ones(), 10);
    }

    #[test]
    fn an_empty_mark_changes_nothing() {
        let mut bm = PairBitmap::new(&[10, 10]);
        bm.mark_pair(0, 1, 0, 0, 0);

        assert_eq!(bm.item(0, 1, 0).count_ones(), 0);
        assert_eq!(bm.item(0, 1, 1).count_ones(), 0);
    }

    #[test]
    fn a_reversed_pair_addresses_the_same_storage() {
        let mut bm = PairBitmap::new(&[10, 10]);
        bm.mark_pair(1, 0, 2, 3, 4);

        assert_eq!(bm.item(0, 1, 0).count_ones(), 4);
        assert_eq!(bm.item(1, 0, 0).count_ones(), 4);
        assert_eq!(bm.item(0, 1, 1).count_ones(), 4);
    }
}
