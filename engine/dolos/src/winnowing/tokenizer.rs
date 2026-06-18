use crate::winnowing::region::Region;
use tree_sitter::{Node, Parser, Tree, TreeCursor};

#[cfg(test)]
use serde::{Deserialize, Serialize};
use tree_sitter_grammars::Language;

#[cfg_attr(test, derive(Serialize, Deserialize))]
#[derive(Debug, PartialEq, Clone)]
pub struct Token {
    pub name: String,
    pub location: Region,
}

pub struct Tokenizer {
    pub language: Language,
    pub include_comments: bool,
    parser: Parser,
}

impl Tokenizer {
    pub fn new(language: Language, include_comments: bool) -> Self {
        let mut parser = Parser::new();
        parser
            .set_language(&language.tree_sitter_language().into())
            .expect("set language");
        Tokenizer { language, include_comments, parser }
    }

    pub fn parse(&mut self, content: &str) -> Tree {
        self.parser.parse(content, None).expect("tree")
    }
}

fn recursive_add<'a: 'b, 'b>(
    node: Node<'a>,
    tokens: &mut Vec<Token>,
    cursor: &mut TreeCursor<'b>,
    include_comments: bool,
) {
    // Skip comment nodes when include_comments is false
    if !include_comments && node.kind().to_lowercase().contains("comment") {
        return;
    }

    let children = node.named_children(cursor).collect::<Vec<Node>>();

    let end_point = children
        .first()
        .map_or(node.end_position(), |c| c.start_position());

    let range = Region::new(node.start_position().into(), end_point.into());

    tokens.push(Token { name: "(".to_string(), location: range });
    tokens.push(Token { name: node.kind().to_string(), location: range });

    for child in children {
        recursive_add(child, tokens, cursor, include_comments);
    }

    tokens.push(Token { name: ")".to_string(), location: range });
}

pub trait Tokens {
    fn tokens(&self, include_comments: bool) -> Vec<Token>;
}

impl Tokens for Tree {
    /// Serializes all named nodes in Tree-sitter's Concrete Syntax Tree (CST)
    /// into a sequence of tokens. Special tokens '(' and ')' are inserted to
    /// represent descending into and ascending from the tree, respectively.
    /// Each token's range corresponds exactly to the token name itself.
    /// When `include_comments` is false, comment nodes are filtered out.
    fn tokens(&self, include_comments: bool) -> Vec<Token> {
        let mut cursor = self.walk();
        let mut tokens = Vec::new();
        recursive_add(cursor.node(), &mut tokens, &mut cursor, include_comments);
        tokens
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::winnowing::fingerprints::Winnow;
    use crate::winnowing::hashes::{RollingHash, hash_token};
    use crate::winnowing::region::Point;
    use std::path::Path;

    #[test]
    fn test_tokenize_simple() {
        let mut tokenizer = Tokenizer::new(Language::Javascript, false);
        let actual = tokenizer.parse("1").tokens(false);

        let r00 = Region::new(Point::new(0, 0), Point::new(0, 0));
        let r01 = Region::new(Point::new(0, 0), Point::new(0, 1));

        let expected = vec![
            Token { name: "(".to_string(), location: r00 },
            Token { name: "program".to_string(), location: r00 },
            Token { name: "(".to_string(), location: r00 },
            Token { name: "expression_statement".to_string(), location: r00 },
            Token { name: "(".to_string(), location: r01 },
            Token { name: "number".to_string(), location: r01 },
            Token { name: ")".to_string(), location: r01 },
            Token { name: ")".to_string(), location: r00 },
            Token { name: ")".to_string(), location: r00 },
        ];

        assert_eq!(actual, expected);
    }

    #[test]
    fn test_tokenize_large() {
        let expected: Vec<Token> = serde_any::from_file("fixtures/sample.tokens.json").unwrap();
        let mut tokenizer = Tokenizer::new(Language::Javascript, false);
        let content = std::fs::read_to_string(Path::new("fixtures/sample1.js")).unwrap();
        let actual = tokenizer.parse(&content).tokens(false);
        assert_eq!(actual, expected);
    }

    /// Regenerate the golden JSON fixtures from the current `fixtures/sample1.js`.
    /// Run with `cargo test --features all-languages -- --ignored regen_golden_fixtures`.
    #[test]
    #[ignore = "only run to regenerate sample fixtures after changing fixtures/sample1.js"]
    fn generate_sample_fixtures() {
        fn write<T: serde::Serialize>(path: impl AsRef<Path>, value: &T) {
            serde_any::to_file_pretty(path, value).unwrap();
        }

        let mut tokenizer = Tokenizer::new(Language::Javascript, false);
        let content = std::fs::read_to_string("fixtures/sample1.js").unwrap();
        let tokens = tokenizer.parse(&content).tokens(false);

        write("fixtures/sample.tokens.json", &tokens);

        let hashes: Vec<_> = tokens.iter().map(|t| hash_token(&t.name)).collect();
        write("fixtures/sample.hashes.json", &hashes);

        for k in [3, 17] {
            let mut rolling = RollingHash::new(k);
            let rolling_hashes: Vec<_> = hashes.iter().map(|&h| rolling.next_hash(h)).collect();

            write(format!("fixtures/sample.rolling{k}.json"), &rolling_hashes);
        }

        for (k, w) in [(3, 5), (16, 8), (17, 23)] {
            let (hashes, locations) = tokens.clone().winnow(k, w, true);

            write(
                format!("fixtures/sample.winnowk{k}w{w}.hashes.json"),
                &hashes,
            );
            write(
                format!("fixtures/sample.winnowk{k}w{w}.locations.json"),
                &locations.unwrap(),
            );
        }
    }
}
