use crate::file::File;
use crate::language::Language;
use crate::winnowing::tokens::Tokens;
use std::fmt;
use tree_sitter::Parser;

pub struct Dolos {
    files: Vec<File>,
    lang: Language,
    parser: Parser,
}

impl Dolos {
    pub fn from_files(files: Vec<File>) -> Self {
        let lang = files
            .first()
            .expect("no files given")
            .lang
            .expect("unknown extension");
        let mut parser = Parser::new();
        parser
            .set_language(lang.tree_sitter_language())
            .expect("set language");
        let mut dolos = Dolos {
            files: vec![],
            lang,
            parser,
        };
        dolos.add_files(files);
        dolos
    }

    pub fn add_file(&mut self, file: File) {
        if !file.lang.eq(&Some(self.lang)) {
            panic!("Language does not match")
        }
        let tree = self
            .parser
            .parse(file.content().expect("content"), None)
            .expect("tree");
        let tokens = Tokens::from_tree(&tree).winnow(23, 17);

        self.files.push(file);
    }

    pub fn add_files(&mut self, files: Vec<File>) {
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
