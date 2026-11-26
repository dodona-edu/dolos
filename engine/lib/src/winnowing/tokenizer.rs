use crate::winnowing::region::{Point, Region};
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

/// The tokenizer of one language.
pub enum Tokenizer {
    /// A tree-sitter parser.
    Code { parser: Parser, include_comments: bool },
    /// One token per character, for plain text.
    Char,
}

impl Tokenizer {
    /// The tokenizer of `language`. `include_comments` keeps the comment nodes of
    /// a tree-sitter language.
    pub fn new(language: Language, include_comments: bool) -> Self {
        let Some(grammar) = language.tree_sitter_language() else {
            return Tokenizer::Char;
        };
        let mut parser = Parser::new();
        parser.set_language(&grammar.into()).expect("set language");
        Tokenizer::Code { parser, include_comments }
    }

    pub fn tokenize(&mut self, content: &str) -> Vec<Token> {
        match self {
            Tokenizer::Code { parser, include_comments } => tree_tokens(
                &parser.parse(content, None).expect("tree"),
                *include_comments,
            ),
            Tokenizer::Char => char_tokens(content),
        }
    }
}

/// One token per character. Line endings are not tokens.
fn char_tokens(content: &str) -> Vec<Token> {
    let mut tokens = Vec::new();
    for (row, line) in content.lines().enumerate() {
        for (column, c) in line.char_indices() {
            let start = Point::new(row, column);
            let end = Point::new(row, column + c.len_utf8());
            tokens.push(Token { name: c.to_string(), location: Region::new(start, end) });
        }
    }
    tokens
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
    let open = Region::new(
        Point::from_tree_sitter(node.start_position()),
        Point::from_tree_sitter(open_end),
    );

    tokens.push(Token { name: "(".to_string(), location: open });
    tokens.push(Token { name: node.kind().to_string(), location: open });

    for child in children {
        recursive_add(child, tokens, cursor, include_comments);
    }

    // `)` closes the node, so it is empty and sits at the node end.
    let end = Point::from_tree_sitter(node.end_position());
    let close = Region::new(end, end);
    tokens.push(Token { name: ")".to_string(), location: close });
}

/// Serializes all named nodes in Tree-sitter's Concrete Syntax Tree (CST)
/// into a sequence of tokens. Special tokens '(' and ')' are inserted to
/// represent descending into and ascending from the tree, respectively.
/// A '(' token covers the node up to its first named child, a ')' token is
/// an empty region at the node end.
/// When `include_comments` is false, comment nodes are filtered out.
fn tree_tokens(tree: &Tree, include_comments: bool) -> Vec<Token> {
    let mut cursor = tree.walk();
    let mut tokens = Vec::new();
    recursive_add(cursor.node(), &mut tokens, &mut cursor, include_comments);
    tokens
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::winnowing::fingerprints::winnow;
    use crate::winnowing::hashes::{RollingHash, hash_token};
    use std::path::Path;

    #[test]
    fn tokens_wrap_every_named_node_in_brackets() {
        let mut tokenizer = Tokenizer::new(Language::Javascript, false);
        let actual = tokenizer.tokenize("1");

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
    fn char_tokens_cover_one_character_each() {
        let mut tokenizer = Tokenizer::new(Language::Char, false);
        let actual = tokenizer.tokenize("é a\r\n\r\nb\n");

        let token = |name: &str, row, start, end| Token {
            name: name.to_string(),
            location: Region::new(Point::new(row, start), Point::new(row, end)),
        };
        // `é` is two bytes. The empty line and the line endings give no tokens.
        let expected = vec![
            token("é", 0, 0, 2),
            token(" ", 0, 2, 3),
            token("a", 0, 3, 4),
            token("b", 2, 0, 1),
        ];

        assert_eq!(actual, expected);
    }

    #[test]
    fn token_locations_advance_through_the_file() {
        // region_from_kgram takes the start of the first token of a kgram and
        // the end of the last one, which needs a stream in source order.
        let mut tokenizer = Tokenizer::new(Language::Javascript, false);
        let content = std::fs::read_to_string(Path::new("fixtures/sample1.js")).unwrap();
        let tokens = tokenizer.tokenize(&content);

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
    fn tokens_match_the_fixture() {
        let expected: Vec<Token> =
            serde_json::from_str(&std::fs::read_to_string("fixtures/sample.tokens.json").unwrap())
                .unwrap();
        let mut tokenizer = Tokenizer::new(Language::Javascript, false);
        let content = std::fs::read_to_string(Path::new("fixtures/sample1.js")).unwrap();
        let actual = tokenizer.tokenize(&content);
        assert_eq!(actual, expected);
    }

    // Run with `cargo test --features all-languages -- --ignored generate_sample_fixtures`.
    #[test]
    #[ignore = "only run to regenerate sample fixtures after changing fixtures/sample1.js"]
    fn generate_sample_fixtures() {
        fn write<T: serde::Serialize>(path: impl AsRef<Path>, value: &T) {
            serde_json::to_writer(std::fs::File::create(path).unwrap(), value).unwrap();
        }

        let mut tokenizer = Tokenizer::new(Language::Javascript, false);
        let content = std::fs::read_to_string("fixtures/sample1.js").unwrap();
        let tokens = tokenizer.tokenize(&content);

        write("fixtures/sample.tokens.json", &tokens);

        let hashes: Vec<_> = tokens.iter().map(|t| hash_token(&t.name)).collect();
        write("fixtures/sample.hashes.json", &hashes);

        for k in [3, 17] {
            let mut rolling = RollingHash::new(k);
            let rolling_hashes: Vec<_> = hashes.iter().map(|&h| rolling.next_hash(h)).collect();

            write(format!("fixtures/sample.rolling{k}.json"), &rolling_hashes);
        }

        for (k, w) in [(3, 5), (16, 8), (17, 23)] {
            let (hashes, locations) = winnow(&tokens, k, w, true);

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
