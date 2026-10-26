use crate::collections::bit_region::{BitRegion, BitRegionMut};

/// A flat, contiguous buffer of `u64` words, carved into bit-vector regions.
///
/// Callers own the addressing: a region is identified by the word it starts at
/// and the number of bits it holds.
pub struct BitVec {
    words: Vec<u64>,
}

impl BitVec {
    /// Allocate `total_words` zero-initialised words.
    pub fn new(total_words: usize) -> Self {
        Self { words: vec![0u64; total_words] }
    }

    /// The number of words in the buffer.
    pub fn word_count(&self) -> usize {
        self.words.len()
    }

    /// Whether the buffer holds no words at all.
    pub fn is_empty(&self) -> bool {
        self.words.is_empty()
    }

    /// The `length`-bit region starting at word `word_base`.
    #[inline]
    pub fn region(&self, word_base: usize, length: usize) -> BitRegion<'_> {
        BitRegion::new(
            &self.words[word_base..word_base + length.div_ceil(64)],
            length,
        )
    }

    /// The `length`-bit region starting at word `word_base`, for writing.
    #[inline]
    pub fn region_mut(&mut self, word_base: usize, length: usize) -> BitRegionMut<'_> {
        BitRegionMut::new(
            &mut self.words[word_base..word_base + length.div_ceil(64)],
            length,
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn regions_are_independent() {
        let mut buf = BitVec::new(3);
        buf.region_mut(0, 100).mark(0, 100);

        assert_eq!(buf.region(0, 100).count_ones(), 100);
        // Word 2 holds the third region; the first two words are the region above.
        assert_eq!(buf.region(2, 64).count_ones(), 0);
    }
}
