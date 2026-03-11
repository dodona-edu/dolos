use crate::tokenizer::Token;
use crate::winnowing::hashes::{RollingHash, hash_token};

pub type Fingerprint = usize;

pub trait Winnow {
    /// Returns a filtered list of fingerprints: the kgrams (of length k) with the minimum hashing
    /// value in a window of length w
    ///
    /// Code based on pseudocode from http://theory.stanford.edu/~aiken/publications/papers/sigmod03.pdf
    ///
    fn winnow(&self, k: usize, w: usize) -> Vec<Fingerprint>;
}

impl Winnow for Vec<Token> {
    /// Returns a filtered list of fingerprints: the kgrams (of length k) with the minimum hashing
    /// value in a window of length w
    ///
    /// Code based on pseudocode from http://theory.stanford.edu/~aiken/publications/papers/sigmod03.pdf
    ///
    fn winnow(&self, k: usize, w: usize) -> Vec<Fingerprint> {
        let mut rolling = RollingHash::new(k);
        let mut window = vec![Fingerprint::MAX; w];
        let mut filtered = Vec::new();

        for token in self.iter().take(k - 1) {
            rolling.next_hash(hash_token(&token.name));
        }

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

                filtered.push(window[min_index % w]);
            } else if window[token_index % w] <= window[min_index % w] {
                // we have found a new minimum
                min_index = token_index;

                filtered.push(window[min_index % w]);
            }
        }

        filtered
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::language::Language;
    use crate::tokenizer::{Tokenizer, Tokens};
    use serde::Deserialize;
    use std::path::Path;
    use tree_sitter::{Point, Range};

    #[derive(Debug, Deserialize)]
    struct DolosFingerprint {
        data: Vec<String>,
        hash: usize,
    }

    const TEST_K_W: [(usize, usize); 3] = [(17, 23), (3, 5), (16, 8)];

    #[test]
    fn test_tokenization_and_winnowing() {
        let mut tokenizer = Tokenizer::new(Language::Javascript);

        for (k, w) in TEST_K_W {
            let expected: Vec<usize> =
                serde_any::from_file(format!("fixtures/sample.winnowk{}w{}.json", k, w)).unwrap();

            let actual = tokenizer
                .parse(Path::new("fixtures/sample1.js"))
                .tokens()
                .winnow(k, w);

            let mut length = 0;
            for (i, fingerprint) in actual.iter().enumerate() {
                assert_eq!(
                    *fingerprint, expected[i],
                    "Mismatch (k={}, w={}): {:?} and {:?}",
                    k, w, fingerprint, expected[i]
                );
                length = i;
            }
            assert_eq!(
                length + 1,
                expected.len(),
                "Too few winnowed tokens for k={} w={}",
                k,
                w
            );
        }
    }

    #[test]
    fn test_winnowing() {
        let range = Range {
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
                range,
            });
        }

        for (k, w) in TEST_K_W {
            let expected: Vec<usize> =
                serde_any::from_file(format!("fixtures/sample.winnowk{}w{}.json", k, w)).unwrap();

            let actual = tokens.winnow(k, w);

            let mut length = 0;
            for (i, fingerprint) in actual.iter().enumerate() {
                assert_eq!(
                    *fingerprint, expected[i],
                    "Mismatch (k={}, w={}): {:?} and {:?}",
                    k, w, fingerprint, expected[i]
                );
                length = i;
            }
            assert_eq!(
                length + 1,
                expected.len(),
                "Too few winnowed tokens for k={} w={}",
                k,
                w
            );
        }
    }
}
