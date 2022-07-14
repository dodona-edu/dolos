use std::fmt;
use std::path::PathBuf;
use crate::file::File;
use tree_sitter::Parser;
use crate::language::Language;

pub struct Dolos {
    files: Vec<File>,
    lang: Language,
    parser: Parser,
}

impl Dolos {
    pub fn from_files(files: Vec<File>) -> Self {
        let lang = files.first().expect("no files given").lang.expect("unknown extension");
        let mut parser = Parser::new();
        parser.set_language(lang.tree_sitter_language()).expect("set language");
        let mut dolos = Dolos {
            files: vec![],
            lang,
            parser,
        };
        dolos.add_files(files);
        dolos
    }

    pub fn add_file(&mut self, mut file: File) {
        if !file.lang.eq(&Some(self.lang)) {
            panic!("Language does not match")
        }
        file.tree = self.parser.parse(file.content().expect("content"), None);
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
