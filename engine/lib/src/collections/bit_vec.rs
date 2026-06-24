use crate::collections::word_slice::WordSlice;

/// A flat, contiguous buffer of `u64` words with bit-level set and count operations.
pub struct BitVec {
    words: Vec<u64>,
}

impl BitVec {
    /// Allocate `total_words` zero-initialised words.
    pub fn new(total_words: usize) -> Self {
        Self { words: vec![0u64; total_words] }
    }

    /// Set bits `[start, start + length)` starting at word offset `word_base`.
    pub fn mark(&mut self, word_base: usize, start: usize, length: usize) {
        if length == 0 {
            return;
        }

        let end = start + length;
        let first_word = start / 64;
        let last_word = (end - 1) / 64;
        let start_bit = start % 64;
        let end_bit = end - last_word * 64;

        if first_word == last_word {
            self.words[word_base + first_word] |= Self::mask_range(start_bit, end_bit);
        } else {
            // First partial word: set bits [start_bit, 64)
            self.words[word_base + first_word] |= Self::mask_range(start_bit, 64);
            // Full middle words
            self.words[(word_base + first_word + 1)..(word_base + last_word)].fill(u64::MAX);
            // Last partial word: set bits [0, end_bit)
            self.words[word_base + last_word] |= Self::mask_range(0, end_bit);
        }
    }

    /// Return the `u64` word slice for `word_count` words starting at `word_base`.
    pub fn words_slice(&self, word_base: usize, word_count: usize) -> WordSlice<'_> {
        WordSlice::new(&self.words[word_base..word_base + word_count])
    }

    /// Count set bits in `word_count` words starting at `word_base`.
    pub fn count_ones(&self, word_base: usize, word_count: usize) -> usize {
        self.words_slice(word_base, word_count).count_ones()
    }

    /// Create a bitmask for bits `[low, high)` within a single `u64` word.
    #[inline]
    fn mask_range(low: usize, high: usize) -> u64 {
        debug_assert!(low <= high, "low ({low}) must be <= high ({high})");
        debug_assert!(high <= 64, "high ({high}) must be <= 64");

        if low == high {
            return 0;
        }

        // Shift a full mask right to get `high - low` set bits, then position at `low`.
        (u64::MAX >> (64 - (high - low))) << low
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn mark_and_count_single_word() {
        let mut buf = BitVec::new(1);
        buf.mark(0, 2, 4); // bits 2..6
        assert_eq!(buf.count_ones(0, 1), 4);
    }

    #[test]
    fn mark_idempotent() {
        let mut buf = BitVec::new(1);
        buf.mark(0, 0, 5);
        buf.mark(0, 0, 5);
        assert_eq!(buf.count_ones(0, 1), 5);
    }

    #[test]
    fn mark_cross_word_boundary() {
        let mut buf = BitVec::new(2);
        buf.mark(0, 60, 10); // spans words 0 and 1
        assert_eq!(buf.count_ones(0, 2), 10);
    }

    #[test]
    fn mark_full_word() {
        let mut buf = BitVec::new(1);
        buf.mark(0, 0, 64);
        assert_eq!(buf.count_ones(0, 1), 64);
    }

    #[test]
    fn mark_empty_is_noop() {
        let mut buf = BitVec::new(1);
        buf.mark(0, 0, 0);
        assert_eq!(buf.count_ones(0, 1), 0);
    }

    #[test]
    fn mark_sweep() {
        for length in [63, 64, 65] {
            for start in 0..128 {
                let mut buf = BitVec::new(3);
                buf.mark(0, start, length);
                assert_eq!(buf.count_ones(0, 3), length);
            }
        }
    }

    #[test]
    fn mask_range_full() {
        assert_eq!(BitVec::mask_range(0, 64), u64::MAX);
    }

    #[test]
    fn mask_range_empty() {
        assert_eq!(BitVec::mask_range(3, 3), 0);
    }

    #[test]
    fn mask_range_middle() {
        // bits 2..5 → 0b11100 = 28
        assert_eq!(BitVec::mask_range(2, 5), 0b11100);
    }
}
