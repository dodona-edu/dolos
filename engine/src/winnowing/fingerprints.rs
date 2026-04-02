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
            let kgram = self
                .windows(k)
                .nth(min_index + 1 - k)
                .expect("incorrect kgram index");
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
    use crate::winnowing::region::{Point, Region};
    use crate::winnowing::tokenizer::{Tokenizer, Tokens};
    use std::path::Path;

    const TEST_K_W: [(usize, usize); 3] = [(17, 23), (3, 5), (16, 8)];

    fn match_hashes(expected: &[Fingerprint], actual: &[Fingerprint]) {
        let mut length = 0;
        for (i, fingerprint) in actual.iter().enumerate() {
            assert_eq!(
                *fingerprint, expected[i],
                "Mismatch: {:?} and {:?}",
                fingerprint, expected[i]
            );
            length = i;
        }
        assert_eq!(length + 1, expected.len(), "Too few winnowed tokens");
    }

    #[test]
    fn test_tokenization_and_winnowing() {
        let mut tokenizer = Tokenizer::new(Language::Javascript);

        for (k, w) in TEST_K_W {
            let expected_hashes: Vec<usize> =
                serde_any::from_file(format!("fixtures/sample.winnowk{}w{}.hashes.json", k, w))
                    .unwrap();
            let expected_locations: Vec<Region> =
                serde_any::from_file(format!("fixtures/sample.winnowk{}w{}.locations.json", k, w))
                    .unwrap();

            let content = std::fs::read_to_string(Path::new("fixtures/sample1.js")).unwrap();
            let result = tokenizer.parse(&content).tokens().winnow(k, w);

            assert_eq!(result.locations, expected_locations);
            match_hashes(&expected_hashes, &result.hashes);
        }
    }

    #[test]
    fn test_winnowing() {
        let range = Region {
            start_byte: 0,
            end_byte: 1,
            start_point: Point::new(0, 0),
            end_point: Point::new(0, 1),
        };
        let token_names: Vec<String> = serde_any::from_file("fixtures/sample.tokens.json").unwrap();
        let mut tokens = Vec::new();
        for i in 0..token_names.len() {
            tokens.push(Token {
                name: token_names[i].to_string(),
                location: range,
            });
        }

        for (k, w) in TEST_K_W {
            let expected: Vec<usize> =
                serde_any::from_file(format!("fixtures/sample.winnowk{}w{}.hashes.json", k, w))
                    .unwrap();

            let result = tokens.winnow(k, w);
            match_hashes(&expected, &result.hashes);
        }
    }
}
