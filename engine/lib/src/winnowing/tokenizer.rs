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
    parser: Parser,
}

impl Tokenizer {
    pub fn new(language: Language) -> Self {
        let mut parser = Parser::new();
        parser
            .set_language(&language.tree_sitter_language().into())
            .expect("set language");
        Tokenizer { parser }
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

    // `(` and the node kind open the node. They cover the text from the node
    // start up to the first named child.
    let open_end = children
        .first()
        .map_or(node.end_position(), |c| c.start_position());
    let open = Region::new(node.start_position().into(), open_end.into());

    tokens.push(Token { name: "(".to_string(), location: open });
    tokens.push(Token { name: node.kind().to_string(), location: open });

    for child in children {
        recursive_add(child, tokens, cursor, include_comments);
    }

    // `)` closes the node, so it is empty and sits at the node end.
    let close = Region::new(node.end_position().into(), node.end_position().into());
    tokens.push(Token { name: ")".to_string(), location: close });
}

pub trait Tokens {
    fn tokens(&self, include_comments: bool) -> Vec<Token>;
}

impl Tokens for Tree {
    /// Serializes all named nodes in Tree-sitter's Concrete Syntax Tree (CST)
    /// into a sequence of tokens. Special tokens '(' and ')' are inserted to
    /// represent descending into and ascending from the tree, respectively.
    /// A '(' token covers the node up to its first named child, a ')' token is
    /// an empty region at the node end.
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
        let mut tokenizer = Tokenizer::new(Language::Javascript);
        let actual = tokenizer.parse("1").tokens(false);

        let r00 = Region::new(Point::new(0, 0), Point::new(0, 0));
        let r01 = Region::new(Point::new(0, 0), Point::new(0, 1));
        // Every node of `1` ends at column 1, so every `)` is empty there.
        let close = Region::new(Point::new(0, 1), Point::new(0, 1));

        let expected = vec![
            Token { name: "(".to_string(), location: r00 },
            Token { name: "program".to_string(), location: r00 },
            Token { name: "(".to_string(), location: r00 },
            Token { name: "expression_statement".to_string(), location: r00 },
            Token { name: "(".to_string(), location: r01 },
            Token { name: "number".to_string(), location: r01 },
            Token { name: ")".to_string(), location: close },
            Token { name: ")".to_string(), location: close },
            Token { name: ")".to_string(), location: close },
        ];

        assert_eq!(actual, expected);
    }

    #[test]
    fn test_token_locations_advance_through_the_file() {
        // region_from_kgram takes the start of the first token of a kgram and
        // the end of the last one, which needs a stream in source order.
        let mut tokenizer = Tokenizer::new(Language::Javascript);
        let content = std::fs::read_to_string(Path::new("fixtures/sample1.js")).unwrap();
        let tokens = tokenizer.parse(&content).tokens(false);

        for pair in tokens.windows(2) {
            assert!(
                pair[0].location.start_point <= pair[1].location.start_point
                    && pair[0].location.end_point <= pair[1].location.end_point,
                "{:?} does not advance to {:?}",
                pair[0],
                pair[1]
            );
        }
    }

    #[test]
    fn test_tokenize_large() {
        let expected: Vec<Token> = serde_any::from_file("fixtures/sample.tokens.json").unwrap();
        let mut tokenizer = Tokenizer::new(Language::Javascript);
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

        let mut tokenizer = Tokenizer::new(Language::Javascript);
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
