use crate::winnowing::hashes::{RollingHash, hash_token};
use crate::winnowing::region::Region;
use crate::winnowing::tokenizer::Token;

pub type Fingerprint = usize;

/// A set of winnowed fingerprints for a single file, pairing each hash with
/// the source region of the k-gram it was derived from.
pub struct Fingerprints {
    pub hashes: Vec<Fingerprint>,
    pub locations: Vec<Region>,
}

fn region_from_kgram(kgram: &[Token]) -> Region {
    let first = &kgram[0];
    let last = &kgram[kgram.len() - 1];
    Region::new(
        first.location.start_byte,
        last.location.end_byte,
        first.location.start_point,
        last.location.end_point,
    )
}

pub trait Winnow {
    /// Returns a filtered list of fingerprints: the kgrams (of length k) with the minimum hashing
    /// value in a window of length w
    ///
    /// Code based on pseudocode from http://theory.stanford.edu/~aiken/publications/papers/sigmod03.pdf
    ///
    fn winnow(&self, k: usize, w: usize) -> Fingerprints;
}

impl Winnow for Vec<Token> {
    /// Returns a filtered list of fingerprints: the kgrams (of length k) with the minimum hashing
    /// value in a window of length w
    ///
    /// Code based on pseudocode from http://theory.stanford.edu/~aiken/publications/papers/sigmod03.pdf
    ///
    fn winnow(&self, k: usize, w: usize) -> Fingerprints {
        let mut rolling = RollingHash::new(k);
        let mut window = vec![usize::MAX; w];
        let mut hashes: Vec<Fingerprint> = Vec::new();
        let mut locations: Vec<Region> = Vec::new();

        for token in self.iter().take(k - 1) {
            rolling.next_hash(hash_token(&token.name));
        }

        let mut record = |min_index: usize, window: &[usize]| {
            let kgram = &self[min_index + 1 - k..min_index + 1];
            hashes.push(window[min_index % w]);
            locations.push(region_from_kgram(kgram));
        };

        let mut min_index = 0;
        for (token_index, token) in self.iter().enumerate().skip(k - 1) {
            window[token_index % w] = rolling.next_hash(hash_token(&token.name));

            if (token_index % w) == (min_index % w) {
                // we've overwritten the previous minimum, search for the next minimum
                for i in 0..w {
                    if window[(token_index + i + 1) % w] <= window[min_index % w] {
                        min_index = token_index + i + 1 - w;
                    }
                }

                record(min_index, &window);
            } else if window[token_index % w] <= window[min_index % w] {
                // we have found a new minimum
                min_index = token_index;

                record(min_index, &window);
            }
        }

        Fingerprints { hashes, locations }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::language::Language;
    use crate::winnowing::region::Region;
    use crate::winnowing::tokenizer::{Tokenizer, Tokens};
    use rstest::rstest;
    use std::path::Path;

    #[rstest]
    #[case::k_3_w_5(3, 5)]
    #[case::k_16_w_8(16, 8)]
    #[case::k_17_w_23(17, 23)]
    fn test_winnowing(#[case] k: usize, #[case] w: usize) {
        let mut tokenizer = Tokenizer::new(Language::Javascript);

        let expected_hashes: Vec<usize> =
            serde_any::from_file(format!("fixtures/sample.winnowk{}w{}.hashes.json", k, w))
                .unwrap();
        let expected_locations: Vec<Region> =
            serde_any::from_file(format!("fixtures/sample.winnowk{}w{}.locations.json", k, w))
                .unwrap();

        let content = std::fs::read_to_string(Path::new("fixtures/sample1.js")).unwrap();
        let result = tokenizer.parse(&content).tokens().winnow(k, w);

        assert_eq!(
            result.hashes.len(),
            expected_hashes.len(),
            "Too few winnowed tokens"
        );

        assert_eq!(result.hashes.len(), result.locations.len());

        for i in 0..result.hashes.len() {
            assert_eq!(
                result.hashes[i], expected_hashes[i],
                "Mismatch: {:?} and {:?}",
                result.hashes[i], expected_hashes[i]
            );
            assert_eq!(
                result.locations[i], expected_locations[i],
                "Mismatch: {:?} and {:?}",
                result.locations[i], expected_locations[i]
            );
        }
    }
}
