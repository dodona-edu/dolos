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
    parser: Parser,
}

impl Tokenizer {
    pub fn new(language: Language) -> Self {
        let mut parser = Parser::new();
        parser
            .set_language(&language.tree_sitter_language().into())
            .expect("set language");
        Tokenizer { language, parser }
    }

    pub fn parse(&mut self, content: &str) -> Tree {
        self.parser.parse(content, None).expect("tree")
    }
}

fn recursive_add<'a: 'b, 'b>(node: Node<'a>, tokens: &mut Vec<Token>, cursor: &mut TreeCursor<'b>) {
    let children = node.named_children(cursor).collect::<Vec<_>>();

    let end_point = children
        .first()
        .map_or(node.end_position(), |c| c.start_position());

    let range = Region::new(node.start_position().into(), end_point.into());

    tokens.push(Token { name: "(".to_string(), location: range });
    tokens.push(Token { name: node.kind().to_string(), location: range });

    for child in children {
        recursive_add(child, tokens, cursor);
    }

    tokens.push(Token { name: ")".to_string(), location: range });
}

pub trait Tokens {
    fn tokens(&self) -> Vec<Token>;
}

impl Tokens for Tree {
    /// Serializes all named nodes in Tree-sitter's Concrete Syntax Tree (CST)
    /// into a sequence of tokens. Special tokens '(' and ')' are inserted to
    /// represent descending into and ascending from the tree, respectively.
    /// Each token's range corresponds exactly to the token name itself.
    fn tokens(&self) -> Vec<Token> {
        let mut cursor = self.walk();
        let mut tokens = Vec::new();

        recursive_add(cursor.node(), &mut tokens, &mut cursor);
        tokens
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::winnowing::region::Point;
    use std::path::Path;

    #[test]
    fn test_tokenize_simple() {
        let mut tokenizer = Tokenizer::new(Language::Javascript);
        let actual = tokenizer.parse("1").tokens();

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
        let mut tokenizer = Tokenizer::new(Language::Javascript);
        let content = std::fs::read_to_string(Path::new("fixtures/sample1.js")).unwrap();
        let actual = tokenizer.parse(&content).tokens();
        assert_eq!(actual, expected);
    }
}
