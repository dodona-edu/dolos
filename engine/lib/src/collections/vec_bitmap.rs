use crate::collections::bit_vec::BitVec;
use crate::collections::word_slice::WordSlice;

/// A flat bitmap storing one independent bit-vector per indexed item.
///
/// Internally, a single contiguous [`BitVec`] is used; each item's bit-vector
/// starts at a precomputed offset so that no individual heap allocations are
/// needed.
pub struct VecBitmap {
    /// Underlying packed bit storage.
    buf: BitVec,
    /// `word_counts[k] = ceil(lengths[k] / 64)`: number of `u64` words for item `k`.
    word_counts: Vec<usize>,
    /// `offsets[k]` = word index in `buf` at which item `k`'s bit-vector begins.
    offsets: Vec<usize>,
}

impl VecBitmap {
    /// Create a new [`VecBitmap`] for items whose bit lengths are given by
    /// `lengths`. All bits are initialized to zero.
    pub fn new(lengths: &[usize]) -> Self {
        let word_counts: Vec<usize> = lengths.iter().map(|&l| l.div_ceil(64)).collect();

        let mut offsets = vec![0usize; lengths.len()];
        let mut total = 0;
        for (i, &wc) in word_counts.iter().enumerate() {
            offsets[i] = total;
            total += wc;
        }

        Self { buf: BitVec::new(total), word_counts, offsets }
    }

    /// Mark bits `[start, start + length)` for item `index` as set.
    pub fn mark(&mut self, index: usize, start: usize, length: usize) {
        self.buf.mark(self.offsets[index], start, length);
    }

    /// Return the number of set bits for item `index`.
    pub fn count_ones(&self, index: usize) -> usize {
        self.buf
            .count_ones(self.offsets[index], self.word_counts[index])
    }

    /// Return a [`WordSlice`] view over the packed `u64` words for item `index`.
    ///
    /// Use this to compose bit operations without allocation, e.g.:
    /// ```ignore
    /// overlap.words_for(i1, i2, i1).and_not(ignore.words_for(i1)).count_ones()
    /// ```
    pub fn words_for(&self, index: usize) -> WordSlice<'_> {
        self.buf
            .words_slice(self.offsets[index], self.word_counts[index])
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mark_and_count() {
        let mut bm = VecBitmap::new(&[10, 10]);
        assert_eq!(bm.count_ones(0), 0);
        assert_eq!(bm.count_ones(1), 0);

        bm.mark(0, 0, 5);
        assert_eq!(bm.count_ones(0), 5);
        assert_eq!(bm.count_ones(1), 0);

        bm.mark(1, 3, 4);
        assert_eq!(bm.count_ones(0), 5);
        assert_eq!(bm.count_ones(1), 4);
    }

    #[test]
    fn test_many_items_partial_marks() {
        let lengths = [20, 65, 130, 10, 200, 64, 99, 128, 300, 50];
        let mut bm = VecBitmap::new(&lengths);

        // Each item is marked in its middle third.
        for (i, &len) in lengths.iter().enumerate() {
            let start = len / 3;
            let mark_len = len / 3;
            if mark_len > 0 {
                bm.mark(i, start, mark_len);
            }
        }

        for (i, &len) in lengths.iter().enumerate() {
            let expected = len / 3;
            assert_eq!(
                bm.count_ones(i),
                expected,
                "item {i} (length {len}): expected {expected} set bits in middle third"
            );
        }
    }
}
