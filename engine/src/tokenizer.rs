use crate::file::File;
use crate::language::Language;

use std::path::PathBuf;

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
            .set_language(language.tree_sitter_language())
            .expect("set language");
        Tokenizer { language, parser }
    }

    pub fn parse(&mut self, path: PathBuf) -> File {
        let content = File::read(&path).expect("content");
        let tree = self.parser.parse(content, None).expect("tree");
        let tokens = Self::tokens(&tree);
        File {
            path,
            tree,
            tokens,
            language: self.language,
        }
    }

    /// Serialize all named nodes in Tree-sitter's Concrete Syntax Tree (CST)
    /// into a list of tokens.
    // TODO: we insert special tokens '(' and ')' to sign descending and
    // ascending in the tree, but they have a location associated with them that
    // does not really make sense...
    fn tokens(tree: &Tree) -> Vec<Token> {
        let mut cursor = tree.walk();
        let mut tokens = Vec::new();

        Self::recursive_add(cursor.node(), &mut tokens, &mut cursor);
        tokens
    }

    fn recursive_add<'a: 'b, 'b>(
        node: Node<'a>,
        tokens: &mut Vec<Token>,
        cursor: &mut TreeCursor<'b>,
    ) {
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
            Self::recursive_add(child, tokens, cursor);
        }

        tokens.push(Token {
            name: ")".to_string(),
            range: node.range(),
        });
    }
}

#[cfg(test)]
mod tests {
    extern crate serde;
    extern crate serde_any;
    extern crate tree_sitter;
    extern crate tree_sitter_javascript;

    use super::*;

    #[test]
    fn test_tokenize() {
        let path = "fixtures/sample.js";
        let expected: Vec<String> = serde_any::from_file("fixtures/sample.tokens.json").unwrap();
        let mut tokenizer = Tokenizer::new(Language::Javascript);

        let file = tokenizer.parse(path.into());
        let actual = file
            .tokens
            .into_iter()
            .map(|t| t.name)
            .collect::<Vec<String>>();

        //dbg!(std::iter::zip(&expected, &actual).collect::<Vec<(&String, &String)>>());

        for i in 0..expected.len() {
            assert_eq!(&expected[i], &actual[i], "Mismatch at {}", i);
        }
        assert_eq!(expected.len(), actual.len());
    }
}
