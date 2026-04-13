use crate::file::File;
use tree_sitter_grammars::Language;
use std::path::Path;

use tree_sitter::{Node, Parser, Range, Tree, TreeCursor};

#[derive(Debug, PartialEq, Clone)]
pub struct Token {
    pub name: String,
    pub range: Range,
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

    pub fn parse(&mut self, path: &Path) -> Tree {
        let content = File::read(path).expect("content");
        self.parser.parse(content, None).expect("tree")
    }
}

fn recursive_add<'a: 'b, 'b>(node: Node<'a>, tokens: &mut Vec<Token>, cursor: &mut TreeCursor<'b>) {
    tokens.push(Token {
        name: "(".to_string(),
        range: node.range(),
    });

    tokens.push(Token {
        name: node.kind().to_string(),
        range: node.range(),
    });

    let children = node.named_children(cursor).collect::<Vec<Node>>();

    for child in children {
        recursive_add(child, tokens, cursor);
    }

    tokens.push(Token {
        name: ")".to_string(),
        range: node.range(),
    });
}

pub trait Tokens {
    fn tokens(&self) -> Vec<Token>;
}

impl Tokens for Tree {
    /// Serialize all named nodes in Tree-sitter's Concrete Syntax Tree (CST)
    /// into a list of tokens.
    // TODO: we insert special tokens '(' and ')' to sign descending and
    // ascending in the tree, but they have a location associated with them that
    // does not really make sense...
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

    #[test]
    fn test_tokenize() {
        let path = Path::new("fixtures/sample1.js");
        let expected: Vec<String> = serde_any::from_file("fixtures/sample.tokens.json").unwrap();
        let mut tokenizer = Tokenizer::new(Language::Javascript);

        let actual = tokenizer
            .parse(path)
            .tokens()
            .into_iter()
            .map(|t| t.name)
            .collect::<Vec<String>>();

        assert_eq!(expected.len(), actual.len());
        assert_eq!(actual, expected);
    }
}
