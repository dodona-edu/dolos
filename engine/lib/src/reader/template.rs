use crate::error::context;
use crate::file::File;
use std::io::Result;
use std::path::PathBuf;
use tree_sitter_grammars::Language;

use super::Input;

/// The read template files in one language, whose fingerprints the analysis ignores.
pub struct Template {
    /// The files in input order.
    pub files: Vec<File>,
}

impl Template {
    /// Read the template from `paths`, in the forms that [`Input::open`]
    /// accepts, and keep only the files of `language`. The other files, and the
    /// files that cannot be read, are skipped with a warning.
    /// Without paths, the template is empty.
    ///
    /// # Errors
    /// Fails when the paths cannot be read.
    pub fn create(paths: Vec<PathBuf>, language: Language) -> Result<Self> {
        if paths.is_empty() {
            return Ok(Self { files: Vec::new() });
        }

        let files = Input::open(paths)
            .map_err(|e| context(e, "could not read the template"))?
            .read_files(language, "template file");
        Ok(Self { files })
    }
}
