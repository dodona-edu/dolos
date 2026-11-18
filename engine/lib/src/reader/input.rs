use crate::file::File;
use std::collections::HashMap;
use std::fs;
use std::io::{Error, ErrorKind, Result};
use std::path::{Path, PathBuf};
use tempfile::TempDir;
use tree_sitter_grammars::Language;

use super::{archive, resolve};

/// The files that a list of input paths points to, before they are read.
#[derive(Debug)]
pub struct Input {
    /// The name of the directory, the CSV file or the archive. `None` for
    /// separate files.
    pub name: Option<String>,
    base_dir: PathBuf,
    /// The paths relative to `base_dir`. They are the display paths of the files.
    relative_paths: Vec<PathBuf>,
    /// The extracted archive. The extracted files exist as long as it lives.
    _extracted: Option<TempDir>,
}

impl Input {
    /// Find the files of `paths`. Accepted inputs:
    ///
    /// - **Several paths** or **one regular file** → each path is a file.
    /// - **One directory** → files collected recursively; `info.csv` is honored
    ///   when present at the top level.
    /// - **One CSV file** → file list read from the `filename` column.
    /// - **One archive** (`.zip`, `.tar`, `.tar.gz`, `.tgz`, `.tar.bz2`, `.tbz`,
    ///   `.tbz2`) → extracted to a temporary directory, then treated as a directory.
    pub fn open(paths: Vec<PathBuf>) -> Result<Self> {
        match paths.as_slice() {
            [] => Err(Error::new(ErrorKind::InvalidInput, "no input paths given")),
            [path] if path.is_dir() => {
                let (name, files) = resolve::from_directory(path)?;
                Ok(Self::new(Some(name), path, files, None))
            }
            [path] if path.extension().is_some_and(|ext| ext == "csv") => {
                let (name, files) = resolve::from_csv(path)?;
                let base_dir = path.parent().unwrap_or(Path::new("."));
                Ok(Self::new(Some(name), base_dir, files, None))
            }
            [path] => match archive::try_extract(path)? {
                Some(extracted) => {
                    let dir = extracted.temp_dir.path().to_path_buf();
                    let (_, files) = resolve::from_directory(&dir)?;
                    Ok(Self::new(
                        Some(extracted.name),
                        dir,
                        files,
                        Some(extracted.temp_dir),
                    ))
                }
                None => Ok(Self::new(None, "", resolve::from_files(paths)?, None)),
            },
            _ => Ok(Self::new(None, "", resolve::from_files(paths)?, None)),
        }
    }

    /// Strip `base_dir` from each of `files`. A file outside `base_dir` keeps its path.
    fn new(
        name: Option<String>,
        base_dir: impl Into<PathBuf>,
        files: Vec<PathBuf>,
        extracted: Option<TempDir>,
    ) -> Self {
        let base_dir = base_dir.into();
        let relative_paths = files
            .into_iter()
            .map(|p| p.strip_prefix(&base_dir).unwrap_or(&p).to_path_buf())
            .collect();
        Self { name, base_dir, relative_paths, _extracted: extracted }
    }

    /// Detect the language that the most file extensions belong to.
    /// [`Language::Char`] counts only when no file belongs to another language.
    ///
    /// # Errors
    /// Fails when no file has a known extension, or when several languages share the highest count.
    pub fn detect_language(&self) -> Result<Language> {
        let mut counts: HashMap<Language, usize> = HashMap::new();
        for path in &self.relative_paths {
            for language in Language::from_path(path) {
                *counts.entry(language).or_default() += 1;
            }
        }
        if counts.len() > 1 {
            counts.remove(&Language::Char);
        }

        let Some(&max) = counts.values().max() else {
            return Err(Error::new(
                ErrorKind::InvalidInput,
                "could not detect the language: no file has a known extension; specify the language",
            ));
        };

        let mut winners: Vec<Language> = counts
            .into_iter()
            .filter(|&(_, count)| count == max)
            .map(|(language, _)| language)
            .collect();
        winners.sort();
        match winners[..] {
            [language] => Ok(language),
            _ => {
                let names: Vec<&str> = winners.into_iter().map(Language::name).collect();
                let files = if max == 1 { "file" } else { "files" };
                Err(Error::new(
                    ErrorKind::InvalidInput,
                    format!(
                        "could not detect the language: {} each match {max} {files}; specify the language",
                        names.join(" and ")
                    ),
                ))
            }
        }
    }

    /// Read the files of `language`, in order. Skip, with a warning, the files
    /// of another language and the files that cannot be read. `noun` names the
    /// files in the warnings, such as `template file`.
    pub fn read_files(self, language: Language, noun: &str) -> Vec<File> {
        let (kept, other_language): (Vec<PathBuf>, Vec<PathBuf>) = self
            .relative_paths
            .into_iter()
            .partition(|path| language.matches(path));
        match other_language.len() {
            0 => {}
            1 => tracing::warn!("skipped 1 {noun} that is not {}", language.name()),
            count => tracing::warn!("skipped {count} {noun}s that are not {}", language.name()),
        }

        let mut files = Vec::new();
        for relative_path in kept {
            match fs::read_to_string(self.base_dir.join(&relative_path)) {
                Ok(content) => files.push(File {
                    id: files.len(),
                    relative_path,
                    content,
                    analysis_data: None,
                }),
                Err(e) => tracing::warn!("skipped {noun} '{}': {e}", relative_path.display()),
            }
        }
        files
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rstest::rstest;

    fn input(paths: &[&str]) -> Input {
        Input::new(None, "", paths.iter().map(PathBuf::from).collect(), None)
    }

    #[test]
    fn open_accepts_a_single_regular_file() {
        let input = Input::open(vec!["fixtures/sample1.js".into()]).unwrap();
        assert_eq!(input.name, None);
        assert_eq!(input.relative_paths, [PathBuf::from("fixtures/sample1.js")]);
    }

    #[test]
    fn open_rejects_a_missing_single_path() {
        let err = Input::open(vec!["does_not_exist.js".into()]).unwrap_err();
        assert_eq!(err.kind(), ErrorKind::NotFound);
    }

    #[rstest]
    #[case::cpp_with_headers(&["a.cpp", "b.cpp", "c.cpp", "d.cpp", "a.h", "b.h", "c.h"], Language::Cpp)]
    #[case::c_with_headers(&["a.c", "b.c", "a.h", "b.h", "c.h"], Language::C)]
    #[case::unknown_majority(&["a.py", "b.py", "x.csv", "y.csv", "z.csv"], Language::Python)]
    #[case::text_only(&["a.txt", "b.md"], Language::Char)]
    #[case::code_before_text(&["a.py", "README.md", "notes.txt", "b.md"], Language::Python)]
    #[case::no_extension(&["Makefile", "a.py"], Language::Python)]
    fn detect_language_picks_majority(#[case] paths: &[&str], #[case] expected: Language) {
        assert_eq!(input(paths).detect_language().unwrap(), expected);
    }

    #[test]
    fn detect_language_rejects_a_tie() {
        let err = input(&["a.h", "b.h", "c.h", "README.md"])
            .detect_language()
            .unwrap_err();
        assert!(err.to_string().contains("C and C++ each match"), "{err}");
    }

    #[test]
    fn detect_language_rejects_unknown_extensions() {
        let err = input(&["data.csv", "Makefile"])
            .detect_language()
            .unwrap_err();
        assert!(
            err.to_string().contains("no file has a known extension"),
            "{err}"
        );
    }

    #[test]
    fn read_files_keeps_the_files_of_the_language() {
        let files = input(&["fixtures/sample1.py", "fixtures/sample1.js", "README.md"])
            .read_files(Language::Javascript, "file");
        let paths: Vec<&Path> = files.iter().map(|f| f.relative_path.as_path()).collect();
        assert_eq!(paths, [Path::new("fixtures/sample1.js")]);
    }
}
