use crate::winnowing::hashes::{RollingHash, hash_token};
use crate::winnowing::region::Region;
use crate::winnowing::tokenizer::Token;

pub type Fingerprint = usize;

/// Computes the source region spanned by a kgram.
fn region_from_kgram(kgram: &[Token]) -> Region {
    // The tokenizer serializes each AST node as `(node_kind <child tokens>)`.
    // All three synthetic tokens (`(`, node kind, `)`) share the same location:
    // from the node's start up to the *first child's* start (not the node's end).
    //
    // Two consequences for picking the start and end of the region:
    //
    // * **Start**: A `)` token closes a node that *opened earlier* in the token
    //   stream, so its `start_point` is the one it was created with — potentially
    //   far before the kgram begins. Using it would make the highlighted region
    //   cover child tokens that are not part of this kgram. We therefore filter
    //   out `)` tokens and take the minimum `start_point` among the rest.
    //   If the kgram consists entirely of `)` tokens, we fall back to `last`,
    //   producing a zero-width region at the end of the kgram.
    //
    // * **End**: Each node's location only reaches as far as its *first child's*
    //   start (see the tokenizer), so a `)` at the end of a kgram has an
    //   `end_point` that falls short of where the child tokens end. We therefore
    //   take the maximum `end_point` across all tokens to reach the true end of
    //   the kgram's content.
    let last = kgram
        .iter()
        .max_by_key(|t| t.location.end_point)
        .expect("kgram is non-empty");
    let first = kgram
        .iter()
        .filter(|t| t.name != ")")
        .min_by_key(|t| t.location.start_point)
        .unwrap_or(last);
    Region::new(first.location.start_point, last.location.end_point)
}

pub trait Winnow {
    /// Returns a filtered list of fingerprints: the kgrams (of length k) with the minimum hashing
    /// value in a window of length w
    ///
    /// Code based on pseudocode from http://theory.stanford.edu/~aiken/publications/papers/sigmod03.pdf
    ///
    fn winnow(
        &self,
        k: usize,
        w: usize,
        keep_location: bool,
    ) -> (Vec<Fingerprint>, Option<Vec<Region>>);
}

impl Winnow for Vec<Token> {
    /// Returns a filtered list of fingerprints: the kgrams (of length k) with the minimum hashing
    /// value in a window of length w
    ///
    /// Code based on pseudocode from http://theory.stanford.edu/~aiken/publications/papers/sigmod03.pdf
    ///
    fn winnow(
        &self,
        k: usize,
        w: usize,
        keep_location: bool,
    ) -> (Vec<Fingerprint>, Option<Vec<Region>>) {
        let mut rolling = RollingHash::new(k);
        let mut window = vec![usize::MAX; w];
        let mut hashes: Vec<Fingerprint> = Vec::new();
        let mut locations: Option<Vec<Region>> = keep_location.then_some(Vec::new());

        for token in self.iter().take(k - 1) {
            rolling.next_hash(hash_token(&token.name));
        }

        let mut record = |min_index: usize, window: &[usize]| {
            let kgram = &self[min_index + 1 - k..min_index + 1];
            hashes.push(window[min_index % w]);
            if let Some(locs) = locations.as_mut() {
                locs.push(region_from_kgram(kgram));
            }
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

        (hashes, locations)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::winnowing::region::Region;
    use crate::winnowing::tokenizer::{Tokenizer, Tokens};
    use rstest::rstest;
    use std::path::Path;
    use tree_sitter_grammars::Language;

    #[rstest]
    #[case::k_3_w_5(3, 5)]
    #[case::k_16_w_8(16, 8)]
    #[case::k_17_w_23(17, 23)]
    fn test_winnowing(#[case] k: usize, #[case] w: usize) {
        let mut tokenizer = Tokenizer::new(Language::Javascript, false);

        let expected_hashes: Vec<usize> =
            serde_any::from_file(format!("fixtures/sample.winnowk{}w{}.hashes.json", k, w))
                .unwrap();
        let expected_locations: Vec<Region> =
            serde_any::from_file(format!("fixtures/sample.winnowk{}w{}.locations.json", k, w))
                .unwrap();

        let content = std::fs::read_to_string(Path::new("fixtures/sample1.js")).unwrap();
        let (hashes, locations) = tokenizer.parse(&content).tokens(false).winnow(k, w, true);

        let locations = locations.expect("Locations should be present");

        assert_eq!(
            hashes.len(),
            expected_hashes.len(),
            "Too few winnowed tokens"
        );
        assert_eq!(hashes.len(), locations.len());

        for i in 0..hashes.len() {
            assert_eq!(
                hashes[i], expected_hashes[i],
                "Mismatch: {:?} and {:?}",
                hashes[i], expected_hashes[i]
            );
            assert_eq!(
                locations[i], expected_locations[i],
                "Mismatch: {:?} and {:?}",
                locations[i], expected_locations[i]
            );
        }
    }
}
