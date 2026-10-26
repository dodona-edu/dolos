use crate::winnowing::hashes::{RollingHash, hash_token};
use crate::winnowing::region::Region;
use crate::winnowing::tokenizer::Token;

pub type Fingerprint = dolos_core::Symbol;

/// Computes the source region spanned by a kgram.
///
/// The token locations advance through the file, so the kgram starts at its
/// first token and ends at its last.
fn region_from_kgram(kgram: &[Token]) -> Region {
    let first = kgram.first().expect("kgram is non-empty");
    let last = kgram.last().expect("kgram is non-empty");
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
        let mut tokenizer = Tokenizer::new(Language::Javascript);

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

    #[rstest]
    #[case::k_3_w_5(3, 5)]
    #[case::k_16_w_8(16, 8)]
    #[case::k_17_w_23(17, 23)]
    fn test_locations_advance_through_the_file(#[case] k: usize, #[case] w: usize) {
        // Fragment::resolve spans a run of these locations, so each one must be
        // well formed and no location may start before the one before it.
        let mut tokenizer = Tokenizer::new(Language::Javascript);
        let content = std::fs::read_to_string(Path::new("fixtures/sample1.js")).unwrap();
        let (_, locations) = tokenizer.parse(&content).tokens(false).winnow(k, w, true);
        let locations = locations.expect("Locations should be present");

        for location in &locations {
            assert!(
                location.start_point <= location.end_point,
                "backwards region {location:?}"
            );
        }
        for pair in locations.windows(2) {
            assert!(
                pair[0].start_point <= pair[1].start_point
                    && pair[0].end_point <= pair[1].end_point,
                "{:?} does not advance to {:?}",
                pair[0],
                pair[1]
            );
        }
    }
}
