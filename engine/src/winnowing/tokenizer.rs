use crate::language::Language;

use crate::winnowing::region::{Point, Region};
use tree_sitter::{Node, Parser, Tree, TreeCursor};

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

    let (end_point, end_byte) = children
        .first()
        .map_or((node.end_position(), node.end_byte()), |c| {
            (c.start_position(), c.start_byte())
        });

    let range = Region::new(
        node.start_byte(),
        end_byte,
        node.start_position().into(),
        end_point.into(),
    );

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
    use std::path::Path;

    #[test]
    fn test_tokenize() {
        let expected: Vec<String> = serde_any::from_file("fixtures/sample.tokens.json").unwrap();
        let mut tokenizer = Tokenizer::new(Language::Javascript);

        let content = std::fs::read_to_string(Path::new("fixtures/sample1.js")).unwrap();
        let actual = tokenizer
            .parse(&content)
            .tokens()
            .into_iter()
            .map(|t| t.name)
            .collect::<Vec<String>>();

        assert_eq!(expected.len(), actual.len());
        assert_eq!(actual, expected);
    }

    #[test]
    fn test_ranges() {
        let mut tokenizer = Tokenizer::new(Language::Javascript);
        let content = std::fs::read_to_string(Path::new("fixtures/simple.js")).unwrap();
        let tokens = tokenizer.parse(&content).tokens();

        let expected = vec![
            Token {
                name: "(".to_string(),
                location: Region::new(0, 0, Point::new(0, 0), Point::new(0, 0)),
            },
            Token {
                name: "program".to_string(),
                location: Region::new(0, 0, Point::new(0, 0), Point::new(0, 0)),
            },
            Token {
                name: "(".to_string(),
                location: Region::new(0, 9, Point::new(0, 0), Point::new(0, 9)),
            },
            Token {
                name: "function_declaration".to_string(),
                location: Region::new(0, 9, Point::new(0, 0), Point::new(0, 9)),
            },
            Token {
                name: "(".to_string(),
                location: Region::new(9, 12, Point::new(0, 9), Point::new(0, 12)),
            },
            Token {
                name: "identifier".to_string(),
                location: Region::new(9, 12, Point::new(0, 9), Point::new(0, 12)),
            },
            Token {
                name: ")".to_string(),
                location: Region::new(9, 12, Point::new(0, 9), Point::new(0, 12)),
            },
            Token {
                name: "(".to_string(),
                location: Region::new(12, 14, Point::new(0, 12), Point::new(0, 14)),
            },
            Token {
                name: "formal_parameters".to_string(),
                location: Region::new(12, 14, Point::new(0, 12), Point::new(0, 14)),
            },
            Token {
                name: ")".to_string(),
                location: Region::new(12, 14, Point::new(0, 12), Point::new(0, 14)),
            },
            Token {
                name: "(".to_string(),
                location: Region::new(15, 21, Point::new(0, 15), Point::new(1, 4)),
            },
            Token {
                name: "statement_block".to_string(),
                location: Region::new(15, 21, Point::new(0, 15), Point::new(1, 4)),
            },
            Token {
                name: "(".to_string(),
                location: Region::new(21, 28, Point::new(1, 4), Point::new(1, 11)),
            },
            Token {
                name: "return_statement".to_string(),
                location: Region::new(21, 28, Point::new(1, 4), Point::new(1, 11)),
            },
            Token {
                name: "(".to_string(),
                location: Region::new(28, 29, Point::new(1, 11), Point::new(1, 12)),
            },
            Token {
                name: "string".to_string(),
                location: Region::new(28, 29, Point::new(1, 11), Point::new(1, 12)),
            },
            Token {
                name: "(".to_string(),
                location: Region::new(29, 32, Point::new(1, 12), Point::new(1, 15)),
            },
            Token {
                name: "string_fragment".to_string(),
                location: Region::new(29, 32, Point::new(1, 12), Point::new(1, 15)),
            },
            Token {
                name: ")".to_string(),
                location: Region::new(29, 32, Point::new(1, 12), Point::new(1, 15)),
            },
            Token {
                name: ")".to_string(),
                location: Region::new(28, 29, Point::new(1, 11), Point::new(1, 12)),
            },
            Token {
                name: ")".to_string(),
                location: Region::new(21, 28, Point::new(1, 4), Point::new(1, 11)),
            },
            Token {
                name: ")".to_string(),
                location: Region::new(15, 21, Point::new(0, 15), Point::new(1, 4)),
            },
            Token {
                name: ")".to_string(),
                location: Region::new(0, 9, Point::new(0, 0), Point::new(0, 9)),
            },
            Token {
                name: ")".to_string(),
                location: Region::new(0, 0, Point::new(0, 0), Point::new(0, 0)),
            },
        ];

        assert_eq!(tokens, expected);
    }
}
