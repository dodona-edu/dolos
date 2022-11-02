use std::collections::VecDeque;
use std::slice::Windows;
use tree_sitter::{Node, Parser, Range, Point, Tree, TreeCursor};
use crate::file::File;
use crate::winnowing::hashes::{hash_token, RollingHash};

#[derive(Debug)]
pub struct Tokens<'a> {
    nodes: Vec<Token<'a>>,
}

#[derive(Debug, PartialEq, Clone)]
pub struct Token<'a> {
    pub name: &'a str,
    pub range: Range,
    pub hash: usize,
}

#[derive(Debug, PartialEq)]
pub struct Fingerprint<'a> {
    pub kgram: Vec<Token<'a>>,
    pub hash: usize,
}

#[derive(Debug)]
pub struct KGrams<'a> {
    k: usize,
    kgrams: Windows<'a, Token<'a>>
}

impl <'a> Tokens<'a> {
    pub(crate) fn tokens(tree: &Tree) -> Vec<Token> {
        let mut cursor = tree.walk();
        tree.root_node().named_children(&mut cursor).map(|node| {
            let name = node.kind();
            Token {
                name,
                range: node.range(),
                hash: hash_token(name),
            }
        }).collect()
    }

    pub(crate) fn kgrams(&self, k: usize) -> Windows<Token> {
        self.nodes.windows(k)
    }

    pub(crate) fn winnow(&self, k: usize, w: usize) -> Vec<Fingerprint> {
        let mut rolling = RollingHash::new(k);
        let mut window = vec![usize::MAX; w];
        let mut filtered = Vec::new();

        for token in self.nodes.iter().take(k - 1) {
            rolling.next_hash(token.hash);
        }

        let mut min_index = 0;
        for (token_index, token) in self.nodes.iter().enumerate().skip(k - 1) {
            window[token_index % w] = rolling.next_hash(token.hash);

            if (token_index % w) == (min_index % w) {
                // we've overwritten the previous minimum, search for the next
                for i in 0..w {
                    if window[(token_index + i + 1) % w] <= window[min_index % w] {
                        min_index = token_index + i + 1 - w;
                    }
                }

                filtered.push(Fingerprint {
                    hash: window[min_index % w],
                    kgram: self.nodes.windows(k).nth(min_index + 1 - k).expect("incorrect kgram index").to_vec()
                });

            } else if window[token_index % w] <= window[min_index % w] {
                // we have found a new minimum
                min_index = token_index;

                filtered.push(Fingerprint {
                    hash: window[min_index % w],
                    kgram: self.nodes.windows(k).nth(min_index + 1 - k).expect("incorrect kgram index").to_vec()
                });
            }
        }

        filtered
    }
}



#[cfg(test)]
mod tests {
    extern crate serde;
    extern crate serde_any;

    use super::*;
    use serde::Deserialize;

    #[derive(Debug, Deserialize)]
    struct DolosFingerprint {
        data: Vec<String>,
        hash: usize,
    }

    #[test]
    fn test_winnow_k17_w23() {
        let range = Range {
            start_byte: 0,
            end_byte: 1,
            start_point: Point::new(0, 0),
            end_point: Point::new(0, 1)
        };
        let token_names: Vec<String> = serde_any::from_file("fixtures/sample.tokens.json").unwrap();
        let hashes: Vec<usize> = serde_any::from_file("fixtures/sample.hashes.json").unwrap();
        let mut tokens = Vec::new();
        for i in 0..token_names.len() {
            tokens.push(Token { name: &token_names[i], range, hash: hashes[i] });
        }
        let tokens = Tokens { nodes: tokens };

        let winnowed: Vec<DolosFingerprint> = serde_any::from_file("fixtures/sample.winnowk17w23.json").unwrap();

        let mut length = 0;
        for (i, fingerprint) in tokens.winnow(17, 23).iter().enumerate() {
            assert_eq!(fingerprint.hash, winnowed[i].hash, "Mismatch: {:?} and {:?}", fingerprint, winnowed[i]);
            length = i;
        }
        assert_eq!(length + 1, winnowed.len(), "Too few winnowed tokens");
    }

    #[test]
    fn test_winnow_k3_w5() {
        let range = Range {
            start_byte: 0,
            end_byte: 1,
            start_point: Point::new(0, 0),
            end_point: Point::new(0, 1)
        };
        let token_names: Vec<String> = serde_any::from_file("fixtures/sample.tokens.json").unwrap();
        let hashes: Vec<usize> = serde_any::from_file("fixtures/sample.hashes.json").unwrap();
        let mut tokens = Vec::new();
        for i in 0..token_names.len() {
            tokens.push(Token { name: &token_names[i], range, hash: hashes[i] });
        }
        let tokens = Tokens { nodes: tokens };

        let winnowed: Vec<DolosFingerprint> = serde_any::from_file("fixtures/sample.winnowk3w5.json").unwrap();

        let mut length = 0;
        for (i, fingerprint) in tokens.winnow(3, 5).iter().enumerate() {
            assert_eq!(fingerprint.hash, winnowed[i].hash, "Mismatch: {:?} and {:?}", fingerprint, winnowed[i]);
            length = i;
        }
        assert_eq!(length + 1, winnowed.len(), "Too few winnowed tokens");
    }

    #[test]
    fn test_winnow_k16_w8() {
        let range = Range {
            start_byte: 0,
            end_byte: 1,
            start_point: Point::new(0, 0),
            end_point: Point::new(0, 1)
        };
        let token_names: Vec<String> = serde_any::from_file("fixtures/sample.tokens.json").unwrap();
        let hashes: Vec<usize> = serde_any::from_file("fixtures/sample.hashes.json").unwrap();
        let mut tokens = Vec::new();
        for i in 0..token_names.len() {
            tokens.push(Token { name: &token_names[i], range, hash: hashes[i] });
        }
        let tokens = Tokens { nodes: tokens };

        let winnowed: Vec<DolosFingerprint> = serde_any::from_file("fixtures/sample.winnowk16w8.json").unwrap();

        let mut length = 0;
        for (i, fingerprint) in tokens.winnow(16, 8).iter().enumerate() {
            assert_eq!(fingerprint.hash, winnowed[i].hash, "Hash mismatch:\n{:?}\n{:?}", fingerprint, winnowed[i]);
            let data: Vec<&str> = fingerprint.kgram.iter().map(|t| t.name).collect();
            assert_eq!(data, winnowed[i].data, "Kgrams mismatch:\n{:?}\n{:?}", fingerprint, winnowed[i]);
            length = i;
        }
        assert_eq!(length + 1, winnowed.len(), "Too few winnowed tokens");
    }
}
