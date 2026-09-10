use crate::collections::bit_region::{BitRegion, BitRegionMut};
use crate::collections::bit_vec::BitVec;

/// A flat bitmap storing one independent bit-vector per indexed item.
///
/// Internally, a single contiguous [`BitVec`] is used; each item's bit-vector
/// starts at a precomputed offset so that no individual heap allocations are
/// needed. Reading and writing bits happens through the [`BitRegion`] an item
/// resolves to.
pub struct VecBitmap {
    /// Underlying packed bit storage.
    buf: BitVec,
    /// Bit length of each item.
    lengths: Vec<usize>,
    /// `word_bases[k]` = word index in `buf` at which item `k`'s bit-vector begins.
    word_bases: Vec<usize>,
}

impl VecBitmap {
    /// Create a new [`VecBitmap`] for items whose bit lengths are given by
    /// `lengths`. All bits are initialized to zero.
    pub fn new(lengths: &[usize]) -> Self {
        let mut word_bases = vec![0usize; lengths.len()];
        let mut total = 0;
        for (item, &length) in lengths.iter().enumerate() {
            word_bases[item] = total;
            total += length.div_ceil(64);
        }

        Self {
            buf: BitVec::new(total),
            lengths: lengths.to_vec(),
            word_bases,
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

    /// The bit-vector of the given item.
    pub fn item(&self, item: usize) -> BitRegion<'_> {
        self.buf.region(self.word_bases[item], self.lengths[item])
    }

    /// The bit-vector of the given item, for writing.
    pub fn item_mut(&mut self, item: usize) -> BitRegionMut<'_> {
        self.buf
            .region_mut(self.word_bases[item], self.lengths[item])
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn items_are_independent() {
        let mut bm = VecBitmap::new(&[10, 10]);
        assert_eq!(bm.item_count(), 2);
        assert_eq!(bm.item(0).count_ones(), 0);

        bm.item_mut(0).mark(0, 5);
        bm.item_mut(1).mark(3, 4);

        assert_eq!(bm.item(0).iter_ones().collect::<Vec<_>>(), [0, 1, 2, 3, 4]);
        assert_eq!(bm.item(1).iter_ones().collect::<Vec<_>>(), [3, 4, 5, 6]);
    }

    #[test]
    fn items_of_mixed_lengths_keep_their_own_bits() {
        let lengths = [20, 65, 130, 10, 200, 64, 99, 128, 300, 50];
        let mut bm = VecBitmap::new(&lengths);

        // Each item is marked in its middle third.
        for (index, &length) in lengths.iter().enumerate() {
            bm.item_mut(index).mark(length / 3, length / 3);
        }

        for (index, &length) in lengths.iter().enumerate() {
            let item = bm.item(index);
            assert_eq!(item.len(), length);
            assert_eq!(
                item.count_ones(),
                length / 3,
                "item {index} (length {length})"
            );
            assert_eq!(item.count_zeros(), length - length / 3);
        }
    }

    #[test]
    fn scans_do_not_leak_into_the_neighbouring_item() {
        let mut bm = VecBitmap::new(&[100, 100, 100]);
        bm.item_mut(0).mark(0, 100);
        bm.item_mut(2).mark(0, 100);

        assert_eq!(bm.item(1).next_one_bit(0, 100), None);
        assert_eq!(bm.item(1).next_zero_bit(0, 100), Some(0));
        assert_eq!(bm.item(2).next_one_bit(0, 100), Some(0));
    }
}
