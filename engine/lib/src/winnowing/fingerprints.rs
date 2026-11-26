use crate::winnowing::hashes::{RollingHash, hash_token};
use crate::winnowing::region::Region;
use crate::winnowing::tokenizer::Token;

/// The hash of one k-gram that winnowing keeps. A file is a sequence of
/// fingerprints.
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

/// Returns the fingerprints of `tokens`: the hash of the kgram (of length `k`)
/// with the minimum hash in each window of `w` kgrams. With `keep_location`,
/// also returns the source region of each fingerprint.
///
/// Code based on pseudocode from http://theory.stanford.edu/~aiken/publications/papers/sigmod03.pdf
pub fn winnow(
    tokens: &[Token],
    k: usize,
    w: usize,
    keep_location: bool,
) -> (Vec<Fingerprint>, Option<Vec<Region>>) {
    let mut rolling = RollingHash::new(k);
    let mut window = vec![usize::MAX; w];
    let mut hashes: Vec<Fingerprint> = Vec::new();
    let mut locations: Option<Vec<Region>> = keep_location.then(Vec::new);

    for token in tokens.iter().take(k - 1) {
        rolling.next_hash(hash_token(&token.name));
    }

    let mut record = |min_index: usize, window: &[usize]| {
        let kgram = &tokens[min_index + 1 - k..min_index + 1];
        hashes.push(window[min_index % w]);
        if let Some(locs) = locations.as_mut() {
            locs.push(region_from_kgram(kgram));
        }
    };

    let mut min_index = 0;
    for (token_index, token) in tokens.iter().enumerate().skip(k - 1) {
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::winnowing::tokenizer::Tokenizer;
    use rstest::rstest;
    use std::path::Path;
    use tree_sitter_grammars::Language;

    #[rstest]
    #[case::k_3_w_5(3, 5)]
    #[case::k_16_w_8(16, 8)]
    #[case::k_17_w_23(17, 23)]
    fn winnow_matches_the_fixture(#[case] k: usize, #[case] w: usize) {
        let mut tokenizer = Tokenizer::new(Language::Javascript, false);

        let expected_hashes: Vec<usize> = serde_json::from_str(
            &std::fs::read_to_string(format!("fixtures/sample.winnowk{k}w{w}.hashes.json"))
                .unwrap(),
        )
        .unwrap();
        let expected_locations: Vec<Region> = serde_json::from_str(
            &std::fs::read_to_string(format!("fixtures/sample.winnowk{k}w{w}.locations.json"))
                .unwrap(),
        )
        .unwrap();

        let content = std::fs::read_to_string(Path::new("fixtures/sample1.js")).unwrap();
        let (hashes, locations) = winnow(&tokenizer.tokenize(&content), k, w, true);

        assert_eq!(hashes, expected_hashes);
        assert_eq!(locations, Some(expected_locations));
    }
}
