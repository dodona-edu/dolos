//! Dolos detects plagiarism in source code.
//!
//! It compares every pair of files in a set and reports how similar they are.
//! It tokenizes each file with tree-sitter, or one token per character for
//! [`Language::Char`], and reduces it to a sequence of [`Fingerprint`]s. All
//! metrics count fingerprints.
//!
//! Each supported [`Language`] with a tree-sitter grammar is behind a `lang-*`
//! feature. The `all-languages` feature enables all of them.
//! [`Language::Char`] is always available.
//!
//! # Examples
//!
//! ```
//! # #[cfg(feature = "lang-javascript")]
//! # fn main() -> std::io::Result<()> {
//! use dolos::{Dolos, DolosConfig};
//! use std::path::Path;
//!
//! let fixtures = Path::new(env!("CARGO_MANIFEST_DIR")).join("fixtures");
//! let files = vec![fixtures.join("sample1.js"), fixtures.join("sample2.js")];
//!
//! let report = Dolos::new(files, DolosConfig::default())?.build_report();
//! assert_eq!(report.pairs.len(), 1);
//!
//! let similarity = report.pairs[0].metrics.similarity;
//! assert!(similarity > 0.0 && similarity <= 1.0);
//! # Ok(())
//! # }
//! # #[cfg(not(feature = "lang-javascript"))]
//! # fn main() {}
//! ```

mod config;
mod dolos;
mod error;
mod file;
mod fragment;
mod ignore;
mod metadata;
mod reader;
mod report;
mod winnowing;

pub use config::{DolosConfig, DolosConfigBuilder, FragmentSortBy, PairSortBy};
pub use dolos::Dolos;
pub use dolos_core::PairMetrics;
pub use file::{AnalysisData, File};
pub use fragment::Fragment;
pub use metadata::Metadata;
pub use report::{Pair, Report};
pub use tree_sitter_grammars::Language;
pub use winnowing::fingerprints::Fingerprint;
pub use winnowing::region::{Point, Region};
