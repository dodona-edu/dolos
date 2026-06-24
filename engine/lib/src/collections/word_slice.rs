use std::ops::{BitAnd, BitOr, BitXor, Not};

/// A borrowed view over packed `u64` words.
#[derive(Copy, Clone)]
pub struct WordSlice<'a>(&'a [u64]);

/// Owned result of a bit operation.
pub struct OwnedWords(Vec<u64>);

// ── Public API ────────────────────────────────────────────────────────────────

impl<'a> WordSlice<'a> {
    pub fn new(words: &'a [u64]) -> Self {
        Self(words)
    }

    pub fn count_ones(self) -> usize {
        self.0.iter().map(|&w| w.count_ones() as usize).sum()
    }
}

impl OwnedWords {
    pub fn count_ones(&self) -> usize {
        self.0.iter().map(|&w| w.count_ones() as usize).sum()
    }
}

// ── Slice access ──────────────────────────────────────────────────────────────

impl AsRef<[u64]> for WordSlice<'_> {
    fn as_ref(&self) -> &[u64] {
        self.0
    }
}

impl AsRef<[u64]> for OwnedWords {
    fn as_ref(&self) -> &[u64] {
        &self.0
    }
}

// ── Bit operations ────────────────────────────────────────────────────────────

fn apply_unary(a: &[u64], f: impl Fn(u64) -> u64) -> OwnedWords {
    OwnedWords(a.iter().map(|&x| f(x)).collect())
}

fn apply_binary(a: &[u64], b: &[u64], f: impl Fn(u64, u64) -> u64) -> OwnedWords {
    debug_assert_eq!(
        a.len(),
        b.len(),
        "WordSlice binary op requires equal-length slices"
    );
    OwnedWords(a.iter().zip(b).map(|(&x, &y)| f(x, y)).collect())
}

impl Not for WordSlice<'_> {
    type Output = OwnedWords;
    fn not(self) -> Self::Output {
        apply_unary(self.0, |x| !x)
    }
}

impl Not for OwnedWords {
    type Output = Self;
    fn not(self) -> Self::Output {
        apply_unary(&self.0, |x| !x)
    }
}

macro_rules! impl_binop {
    ($lhs:ty, $trait:ident, $fn:ident, $op:tt) => {
        impl<R: AsRef<[u64]>> $trait<R> for $lhs {
            type Output = OwnedWords;
            fn $fn(self, rhs: R) -> Self::Output {
                apply_binary(self.as_ref(), rhs.as_ref(), |a, b| a $op b)
            }
        }
    };
}

impl_binop!(WordSlice<'_>, BitAnd, bitand, &);
impl_binop!(WordSlice<'_>, BitOr,  bitor,  |);
impl_binop!(WordSlice<'_>, BitXor, bitxor, ^);

impl_binop!(OwnedWords, BitAnd, bitand, &);
impl_binop!(OwnedWords, BitOr,  bitor,  |);
impl_binop!(OwnedWords, BitXor, bitxor, ^);

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    fn slice(words: &[u64]) -> WordSlice<'_> {
        WordSlice::new(words)
    }

    #[test]
    fn test_not() {
        let a = [0b1010, 0b1100, 0b0011];
        assert_eq!((!slice(&a)).as_ref(), &[!0b1010, !0b1100, !0b0011]);
    }

    #[test]
    fn test_and() {
        assert_eq!(
            (slice(&[0b1111, 0b1010, 0b1100]) & slice(&[0b1010, 0b0101, 0b1001])).as_ref(),
            &[0b1010, 0b0000, 0b1000]
        );
    }

    #[test]
    fn test_or() {
        assert_eq!(
            (slice(&[0b1010, 0b0000, 0b1010]) | slice(&[0b0101, 0b1111, 0b0101])).as_ref(),
            &[0b1111, 0b1111, 0b1111]
        );
    }

    #[test]
    fn test_xor() {
        assert_eq!(
            (slice(&[0b1111, 0b1010, 0b0000]) ^ slice(&[0b1010, 0b1010, 0b1111])).as_ref(),
            &[0b0101, 0b0000, 0b1111]
        );
    }

    #[test]
    fn test_count_ones() {
        assert_eq!(slice(&[0b1011, 0b0110, 0b1111, 0b0001]).count_ones(), 10);
    }

    #[test]
    fn test_word_slice_with_owned() {
        let owned = !slice(&[0b1100, 0b0011, 0b1010]); // OwnedWords
        let result = slice(&[0b1111, 0b1111, 0b1111]) & owned; // WordSlice & OwnedWords
        assert_eq!(result.as_ref(), &[0b0011, 0b1100, 0b0101]);
    }

    #[test]
    fn test_large_chain() {
        let a = slice(&[0b10101010, 0b11001100, 0b11110000, 0b10110100, 0b11001001]);
        let b = slice(&[0b01110011, 0b10100101, 0b00111100, 0b01001011, 0b01010110]);

        assert_eq!(
            (((((a ^ b) & a) | b) ^ a) & b).as_ref(),
            &[0b01010001, 0b00100001, 0b00001100, 0b01001011, 0b00010110]
        );
    }

    #[test]
    #[should_panic]
    fn mismatched_lengths_panic_in_debug() {
        let _ = slice(&[1, 2]) & slice(&[1]);
    }
}
