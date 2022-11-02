use std::collections::VecDeque;
use std::slice::Windows;
use tree_sitter::{Node, Parser, Range, Tree, TreeCursor};
use crate::file::File;
use crate::winnowing::hashes::{hash_token, RollingHash};

pub struct Tokens {
    nodes: Vec<Token>,
}

pub struct Token {
    pub name: &'static str,
    pub range: Range,
    pub hash: usize,
}

pub struct Fingerprint {
    pub kgram: Vec<Token>,
    pub hash: usize,
}

pub struct KGrams<'a> {
    k: usize,
    kgrams: Windows<'a, Token>
}

impl Tokens {
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

    pub(crate) fn winnow(&self, k: usize, w: usize) -> Windows<Token> {
        let hash = RollingHash::new(k);
        //let window = VecDeque::new();

        self.kgrams(k)
    }
}



