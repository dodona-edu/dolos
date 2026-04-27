use crate::file::File;
use crate::opts::{ResolvedIndexConfig, ResolvedReportArgs};
use crate::report::Report;
use crate::suffixtree::tree::SuffixTree;
use crate::winnowing::fingerprints::{Fingerprint, Winnow};
use crate::winnowing::region::Region;
use crate::winnowing::tokenizer::{Tokenizer, Tokens};
use std::fmt;
use std::path::PathBuf;
use std::rc::Rc;

pub struct Dolos {
    config: ResolvedIndexConfig,
    files: Vec<Rc<File>>,
    hashes: Vec<Vec<Fingerprint>>,
    locations: Option<Vec<Vec<Region>>>,
    tokenizer: Tokenizer,
}

impl Dolos {
    pub fn from_paths(paths: Vec<PathBuf>, config: ResolvedIndexConfig) -> Self {
        let tokenizer = Tokenizer::new(config.language, config.include_comments);
        let locations = config.keep_fragments.then_some(Vec::new());
        let mut dolos = Dolos {
            config,
            files: Vec::new(),
            hashes: Vec::new(),
            locations,
            tokenizer,
        };
        dolos.add_files(paths);
        dolos
    }

    fn tokenize_file(&mut self, path: PathBuf) {
        if !self.config.language.matches(&path) {
            panic!("Language does not match")
        }

        let content = std::fs::read_to_string(&path).expect("should be able to read file");
        let (hashes, locations) = self
            .tokenizer
            .parse(&content)
            .tokens(self.tokenizer.include_comments)
            .winnow(
                self.config.kgram_length,
                self.config.kgrams_in_window,
                self.config.keep_fragments,
            );

        self.hashes.push(hashes);
        if let Some(locs) = self.locations.as_mut() {
            locs.push(locations.expect("locations should be present when keep_fragments is true"));
        }

        let file = Rc::new(File { path, content: self.config.keep_fragments.then_some(content) });

        self.files.push(file);
    }

    fn add_files(&mut self, paths: Vec<PathBuf>) {
        for path in paths {
            self.tokenize_file(path);
        }
    }

    pub fn build_report(self, report_config: ResolvedReportArgs) -> Report {
        let tree = SuffixTree::new(&self.hashes);
        let result = tree.analyze(&self.hashes, 1, self.config.keep_fragments);
        Report::from(result, self.files, self.locations, report_config)
    }
}

impl fmt::Debug for Dolos {
    fn fmt(&self, fmt: &mut fmt::Formatter) -> fmt::Result {
        fmt.debug_struct("Dolos")
            .field("language", &self.config.language)
            .field("files", &self.files)
            .finish()
    }
}
