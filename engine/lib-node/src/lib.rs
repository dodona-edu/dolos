//! The Node.js binding of `dolos-lib`: the `Dolos` class and the types of its
//! report.

mod types;

pub use types::{
    DolosConfig, File, Fragment, FragmentSortBy, Language, Metadata, Pair, PairMetrics, PairSortBy,
    Point, Region, Report,
};

use napi::ScopedTask;
use napi::bindgen_prelude::{AsyncTask, Env, Result};
use napi_derive::napi;
use types::ReportData;

/// A plagiarism analysis over a set of source files.
///
/// @example
/// ```ts
/// import { Dolos } from "@dodona/dolos-lib";
///
/// const dolos = new Dolos(["sample1.js", "sample2.js"]);
/// const report = await dolos.buildReport();
/// console.log(report.pairs[0].metrics.similarity);
/// ```
#[napi]
pub struct Dolos(Option<dolos::Dolos>);

#[napi]
impl Dolos {
    /// Create an analysis: read, tokenize and fingerprint the input files.
    ///
    /// Only the files of the configured language are analyzed. Without a
    /// language in `config`, the language that most file extensions belong to
    /// is used.
    ///
    /// @param paths The input, in one of these forms: several files, one
    /// directory, one CSV file with a `filename` column, or one archive
    /// (`.zip`, `.tar`, `.tar.gz`, `.tgz`, `.tar.bz2`, `.tbz`, `.tbz2`).
    /// @param config The options of the analysis. Every option is optional.
    /// @throws When `config` has a value out of range, when the input cannot
    /// be read, or when fewer than 2 files of the language remain. The `code`
    /// of the error is the kind of the Rust I/O error, such as `"InvalidInput"`
    /// or `"NotFound"`.
    #[napi(constructor)]
    pub fn new(paths: Vec<String>, config: Option<DolosConfig>) -> Result<Self, String> {
        let config = dolos::DolosConfig::try_from(config.unwrap_or_default()).map_err(io_error)?;
        let paths = paths.into_iter().map(Into::into).collect();
        let dolos = dolos::Dolos::new(paths, config).map_err(io_error)?;
        Ok(Dolos(Some(dolos)))
    }

    /// Compare all files pairwise and build the report. The comparison runs
    /// on the thread pool of Node.js.
    ///
    /// The pairs hold fragments only when `report.metadata.includeFragments`
    /// is `true`: with exactly 2 files, or with the `compare` option.
    ///
    /// @throws When `buildReport` was already called on this analysis.
    #[napi(ts_return_type = "Promise<Report>")]
    pub fn build_report(&mut self) -> Result<AsyncTask<BuildReport>> {
        let dolos = self.0.take().ok_or_else(|| {
            napi::Error::from_reason("buildReport can be called only once on a Dolos analysis")
        })?;
        Ok(AsyncTask::new(BuildReport(Some(dolos))))
    }
}

/// Convert an I/O error to a JavaScript error with the error kind as `code`.
fn io_error(error: std::io::Error) -> napi::Error<String> {
    napi::Error::new(format!("{:?}", error.kind()), error)
}

/// The task that runs [`dolos::Dolos::build_report`] on the thread pool.
pub struct BuildReport(Option<dolos::Dolos>);

impl<'task> ScopedTask<'task> for BuildReport {
    type Output = ReportData;
    type JsValue = Report<'task>;

    fn compute(&mut self) -> Result<ReportData> {
        let dolos = self.0.take().expect("napi runs compute once");
        Ok(ReportData::from(dolos.build_report()))
    }

    fn resolve(&mut self, env: &'task Env, output: ReportData) -> Result<Report<'task>> {
        output.into_js(env)
    }
}
