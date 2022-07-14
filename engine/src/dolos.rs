use std::fmt;
use crate::file::File;
use tree_sitter::Parser;

pub struct Dolos {
    files: Vec<File>,
    parser: Parser,
}

impl Dolos {
    pub fn new() -> Self {
        let mut parser = Parser::new();
        parser.set_language(tree_sitter_java::language()).expect("set language");
        Dolos {
            files: vec![],
            parser,
        }
    }

    pub fn add_file(&mut self, mut file: File) {
        file.tree = self.parser.parse(file.content().expect("content"), None);
        self.files.push(file);
    }

    pub fn add_files(&mut self, mut files: Vec<File>) {
        for file in files {
            self.add_file(file);
        }
    }
}

impl fmt::Debug for Dolos {
    fn fmt(&self, fmt: &mut fmt::Formatter) -> fmt::Result {
        fmt.debug_struct("Dolos")
            .field("files", &self.files)
            .field("parser", &self.parser.language())
            .finish()
    }
}
