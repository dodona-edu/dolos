pub type Hash = usize;

/// The modulus of the hash calculations: the largest prime with 26 bits. The
/// product of two hashes fits in the 53-bit precision of a JavaScript number.
const MOD: usize = 33554393;

/// The base of the rolling hash: the largest prime with 22 bits.
const BASE_ROLLING: usize = 4194301;

/// The base of the token hash: the largest prime such that
/// `127 * BASE_TOKEN < MOD`.
const BASE_TOKEN: usize = 747287;

/// A rolling hash over the last `k` token hashes.
///
/// It gives the same hashes as the npm `@dodona/dolos-lib` package.
pub struct RollingHash {
    k: usize,
    max_base: usize,
    memory: Vec<usize>,
    i: usize,
    hash: usize,
}

impl RollingHash {
    pub fn new(k: usize) -> Self {
        RollingHash {
            k,
            max_base: MOD - mod_exp(BASE_ROLLING, k, MOD),
            memory: vec![0; k],
            i: 0,
            hash: 0,
        }
    }

    /// Adds a token to the rolling hash and calculates the new hash value.
    pub fn next_hash(&mut self, token: usize) -> Hash {
        self.hash = (BASE_ROLLING * self.hash + token + self.max_base * self.memory[self.i]) % MOD;
        self.memory[self.i] = token;
        self.i = (self.i + 1) % self.k;
        self.hash
    }
}

/// The hash of one token.
pub fn hash_token(token: &str) -> Hash {
    token
        .bytes()
        .fold(0, |hash, byte| ((hash + byte as usize) * BASE_TOKEN) % MOD)
}

/// Modular exponentiation without overflowing.
///
/// Code based on the pseudocode at <https://en.wikipedia.org/wiki/Modular_exponentiation#Pseudocode>.
const fn mod_exp(base: usize, exp: usize, modulus: usize) -> usize {
    let mut y = 1;
    let mut b = base;
    let mut e = exp;
    while e > 1 {
        if e % 2 == 1 {
            y = (b * y) % modulus;
        }
        b = (b * b) % modulus;
        e >>= 1;
    }
    (b * y) % modulus
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::winnowing::tokenizer::Token;
    use rstest::rstest;

    #[test]
    fn mod_exp_matches_known_value() {
        assert_eq!(mod_exp(4, 13, 497), 445);
    }

    #[test]
    fn hash_token_matches_the_fixture() {
        let tokens: Vec<Token> =
            serde_json::from_str(&std::fs::read_to_string("fixtures/sample.tokens.json").unwrap())
                .unwrap();
        let expected_hashes: Vec<usize> =
            serde_json::from_str(&std::fs::read_to_string("fixtures/sample.hashes.json").unwrap())
                .unwrap();

        assert_eq!(tokens.len(), expected_hashes.len());
        for (token, &expected) in tokens.iter().zip(&expected_hashes) {
            assert_eq!(
                hash_token(&token.name),
                expected,
                "mismatch for '{}'",
                token.name
            );
        }
    }

    #[rstest]
    #[case::k_3(3)]
    #[case::k_17(17)]
    fn rolling_hash_matches_the_fixture(#[case] k: usize) {
        let tokens: Vec<Token> =
            serde_json::from_str(&std::fs::read_to_string("fixtures/sample.tokens.json").unwrap())
                .unwrap();
        let token_hashes: Vec<usize> =
            serde_json::from_str(&std::fs::read_to_string("fixtures/sample.hashes.json").unwrap())
                .unwrap();
        let expected_hashes: Vec<usize> = serde_json::from_str(
            &std::fs::read_to_string(format!("fixtures/sample.rolling{k}.json")).unwrap(),
        )
        .unwrap();

        assert_eq!(token_hashes.len(), expected_hashes.len());
        let mut hasher = RollingHash::new(k);
        for (i, (&token_hash, &expected)) in token_hashes.iter().zip(&expected_hashes).enumerate() {
            assert_eq!(
                hasher.next_hash(token_hash),
                expected,
                "mismatch at k={k}, index {i} for '{}'",
                tokens[i].name
            );
        }
    }
}
