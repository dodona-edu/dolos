use dolos::{AnalysisData, Dolos, DolosConfig, File, Language, PairSortBy, Report};
use dolos_core::AnalysisOptions;
use rstest::rstest;
use std::path::PathBuf;

// ── Fixture files ─────────────────────────────────────────────────────────────

const SAMPLE12: &[&str] = &["fixtures/sample1.js", "fixtures/sample2.js"];
const SAMPLE123: &[&str] = &[
    "fixtures/sample1.js",
    "fixtures/sample2.js",
    "fixtures/sample3.js",
];
/// 13 lines of `Blok` accessors that also occur in sample1.js and sample2.js.
const IGNORE: &str = "fixtures/sample_ignore.js";
/// A template that shares no fingerprint with any sample, so ignoring it is a
/// no-op.
const IGNORE_INERT: &str = "fixtures/sample_ignore_inert.js";
/// Two JavaScript files, one Python file and one file without a language.
const MIXED: &[&str] = &[
    "fixtures/sample1.js",
    "fixtures/sample2.js",
    "fixtures/sample1.py",
    "fixtures/README.md",
];
/// As many JavaScript as Python files, so the language cannot be detected.
const JS_AND_PY: &[&str] = &[
    "fixtures/sample1.js",
    "fixtures/sample2.js",
    "fixtures/sample1.py",
    "fixtures/sample2.py",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

fn to_path_buf(names: &[&str]) -> Vec<PathBuf> {
    names.iter().map(PathBuf::from).collect()
}

/// The paths of the files that the report analyzed.
fn kept_paths(report: &Report) -> Vec<PathBuf> {
    report
        .files
        .iter()
        .map(|file| file.relative_path.clone())
        .collect()
}

fn report(files: &[&str], config: DolosConfig) -> Report {
    Dolos::new(to_path_buf(files), config)
        .unwrap()
        .build_report()
}

fn pair_sim(files: &[&str], config: DolosConfig) -> f64 {
    let report = report(files, config);

    report
        .pairs
        .iter()
        .find(|p| {
            let lf = p
                .left_file
                .relative_path
                .file_name()
                .and_then(|n| n.to_str());
            let rf = p
                .right_file
                .relative_path
                .file_name()
                .and_then(|n| n.to_str());

            (lf == Some("sample1.js") && rf == Some("sample2.js"))
                || (lf == Some("sample2.js") && rf == Some("sample1.js"))
        })
        .unwrap_or_else(|| panic!("no pair (sample1.js, sample2.js) in results"))
        .metrics
        .similarity
}

fn is_sorted_desc<T, K: PartialOrd>(items: &[T], key: impl Fn(&T) -> K) -> bool {
    items.windows(2).all(|w| key(&w[0]) >= key(&w[1]))
}

// ── Parameterized similarity tests ────────────────────────────────────────────

/// Verifies the similarity produced by various configurations. Each row in the
/// table is the single source of truth for that config's expected output.
#[rstest]
#[case::default(SAMPLE12, DolosConfig::default(), 0.4803921568627451)]
#[case::kgram_length(SAMPLE12, DolosConfig::builder().kgram_length(10).build().unwrap(), 0.6842105263157895)]
#[case::kgrams_in_window(SAMPLE12, DolosConfig::builder().kgrams_in_window(5).build().unwrap(), 0.479020979020979)]
#[case::include_comments(SAMPLE12, DolosConfig::builder().include_comments(true).build().unwrap(), 0.47619047619047616)]
#[case::min_length_match(SAMPLE12, DolosConfig::builder().min_length_match(10).build().unwrap(), 0.20588235294117646)]
#[case::max_fingerprint_count(SAMPLE123, DolosConfig::builder().max_fingerprint_count(2).build().unwrap(), 0.03636363636363636)]
#[case::max_fingerprint_percentage(SAMPLE123, DolosConfig::builder().max_fingerprint_percentage(0.7).build().unwrap(), 0.03636363636363636)]
#[case::ignore(SAMPLE12, DolosConfig::builder().ignore(IGNORE).build().unwrap(), 0.43548387096774194)]
#[case::inert_ignore(SAMPLE12, DolosConfig::builder().ignore(IGNORE_INERT).build().unwrap(), 0.4803921568627451)]
#[case::cap_below_one_file(SAMPLE123, DolosConfig::builder().max_fingerprint_percentage(0.1).build().unwrap(), 0.0)]
#[case::cap_at_file_count(SAMPLE123, DolosConfig::builder().max_fingerprint_count(3).build().unwrap(), 0.4803921568627451)]
fn test_similarities(
    #[case] files: &[&str],
    #[case] config: DolosConfig,
    #[case] expected_sim: f64,
) {
    assert_eq!(pair_sim(files, config), expected_sim);
}

// ── Fragment presence ─────────────────────────────────────────────────────────

#[test]
fn test_two_files_have_fragments() {
    let report = report(SAMPLE12, DolosConfig::default());

    for pair in &report.pairs {
        assert!(
            pair.fragments.is_some(),
            "fragments should be present when exactly 2 files are given"
        );
    }
}

#[test]
fn test_three_files_no_fragments() {
    let report = report(SAMPLE123, DolosConfig::default());

    for pair in &report.pairs {
        assert!(
            pair.fragments.is_none(),
            "fragments should be None when more than 2 files are given"
        );
    }
}

// ── Pair sorting ──────────────────────────────────────────────────────────────

/// The library sorts `report.pairs` in descending order for each `sort_by` mode.
#[rstest]
#[case::similarity(PairSortBy::Similarity)]
#[case::total_overlap(PairSortBy::TotalOverlap)]
#[case::longest_fragment(PairSortBy::LongestFragment)]
fn test_sort_by(#[case] sort_by: PairSortBy) {
    let report = report(
        SAMPLE123,
        DolosConfig::builder().sort_by(sort_by).build().unwrap(),
    );

    let ordered = match sort_by {
        PairSortBy::Similarity => is_sorted_desc(&report.pairs, |p| p.metrics.similarity),
        PairSortBy::TotalOverlap => is_sorted_desc(&report.pairs, |p| {
            p.metrics.overlap_left + p.metrics.overlap_right
        }),
        PairSortBy::LongestFragment => is_sorted_desc(&report.pairs, |p| p.metrics.longest_match),
    };
    assert!(ordered, "pairs not in descending order for {sort_by:?}");
}

// ── Input modes ───────────────────────────────────────────────────────────────

/// All input modes (directory, CSV manifest, zip, tar, tar.gz, tar.bz2) must
/// produce the same similarity as passing the two loose files directly.
#[test]
fn test_input_modes() {
    let base_sim = pair_sim(SAMPLE12, DolosConfig::default());

    let inputs = [
        "fixtures/reader",
        "fixtures/reader/info.csv",
        "fixtures/reader.zip",
        "fixtures/reader.tar",
        "fixtures/reader.tar.gz",
        "fixtures/reader.tar.bz2",
    ];

    for input in inputs {
        let sim = pair_sim(&[input], DolosConfig::default());
        assert_eq!(sim, base_sim, "{input}: similarity must match baseline");
    }
}

// ── Language filtering ────────────────────────────────────────────────────────

#[test]
fn test_detected_language_skips_other_files() {
    let report = Dolos::new(to_path_buf(MIXED), DolosConfig::default())
        .unwrap()
        .build_report();

    assert_eq!(
        kept_paths(&report),
        to_path_buf(&["fixtures/sample1.js", "fixtures/sample2.js"])
    );
}

#[test]
fn test_tied_languages_are_ambiguous() {
    let err = Dolos::new(to_path_buf(JS_AND_PY), DolosConfig::default()).unwrap_err();
    assert!(err.to_string().contains("[Javascript, Python]"), "{err}");
}

#[test]
fn test_explicit_language_skips_other_files() {
    let config = DolosConfig::builder()
        .language(Language::Python)
        .build()
        .unwrap();
    let report = Dolos::new(to_path_buf(JS_AND_PY), config)
        .unwrap()
        .build_report();

    assert_eq!(
        kept_paths(&report),
        to_path_buf(&["fixtures/sample1.py", "fixtures/sample2.py"])
    );
}

#[test]
fn test_too_few_files_after_filtering() {
    let config = DolosConfig::builder()
        .language(Language::Python)
        .build()
        .unwrap();
    let err = Dolos::new(to_path_buf(MIXED), config).unwrap_err();

    assert!(err.to_string().contains("at least 2 Python files"), "{err}");
}

// ── Analysis data export ──────────────────────────────────────────────────────

#[test]
fn analysis_data_is_absent_by_default() {
    let report = report(SAMPLE12, DolosConfig::default());

    for file in &report.files {
        assert!(
            file.analysis_data.is_none(),
            "analysis data must not be exported without include_analysis_data"
        );
    }
}

/// Every file carries its fingerprints with one region each, and nothing is
/// ignored when no template and no cap is given.
#[test]
fn analysis_data_holds_a_region_per_fingerprint() {
    let config = DolosConfig::builder()
        .include_analysis_data(true)
        .build()
        .unwrap();
    let report = report(SAMPLE123, config);

    assert_eq!(report.files.len(), 3);
    for file in &report.files {
        let data = file
            .analysis_data
            .as_ref()
            .expect("analysis data is present when include_analysis_data is set");

        assert!(!data.fingerprints.is_empty());
        assert_eq!(data.fingerprints.len(), data.regions.len());
        assert!(data.ignored.is_empty());
    }
}

/// A template marks the positions of its own fingerprints as ignored, and the
/// intervals stay inside the file.
#[test]
fn a_template_shows_up_as_ignored_intervals() {
    let config = DolosConfig::builder()
        .include_analysis_data(true)
        .ignore(IGNORE)
        .build()
        .unwrap();
    let report = report(SAMPLE12, config);

    for file in &report.files {
        let data = file.analysis_data.as_ref().unwrap();
        let ignored: usize = data.ignored.iter().map(|r| r.len()).sum();

        assert!(!data.ignored.is_empty(), "the template ignores nothing");
        assert!(ignored < data.fingerprints.len(), "everything is ignored");
        assert!(
            data.ignored
                .iter()
                .all(|r| r.end <= data.fingerprints.len())
        );
        // The intervals are maximal runs, so they never touch.
        assert!(data.ignored.windows(2).all(|w| w[0].end < w[1].start));
    }
}

/// A template that shares no fingerprint with the input ignores nothing.
#[test]
fn an_inert_template_ignores_nothing() {
    let config = DolosConfig::builder()
        .include_analysis_data(true)
        .ignore(IGNORE_INERT)
        .build()
        .unwrap();
    let report = report(SAMPLE12, config);

    for file in &report.files {
        assert!(file.analysis_data.as_ref().unwrap().ignored.is_empty());
    }
}

// ── Replaying a pair from the exported data ───────────────────────────────────

/// Export the analysis data, and cap the fingerprints so the ones shared by all
/// three files are ignored.
fn replay_config() -> DolosConfig {
    DolosConfig::builder()
        .include_analysis_data(true)
        .max_fingerprint_count(2)
        .build()
        .unwrap()
}

/// The analysis options that produced `report`.
fn analysis_options(report: &Report) -> AnalysisOptions {
    AnalysisOptions {
        min_match_length: report.metadata.min_length_match,
        keep_matches: report.metadata.include_fragments,
    }
}

/// The exported analysis data of `file`.
fn data(file: &File) -> &AnalysisData {
    file.analysis_data
        .as_ref()
        .expect("analysis data is present when include_analysis_data is set")
}

/// Every pair of the report, analysed again from the two files' exported
/// fingerprints and ignored positions, gives the metrics of the full run.
#[test]
fn a_pair_replayed_from_the_exported_data_reproduces_the_run() {
    let report = report(SAMPLE123, replay_config());
    let options = analysis_options(&report);

    // The cap must ignore something without swallowing the corpus, or this
    // proves nothing.
    let ignored: usize = report
        .files
        .iter()
        .flat_map(|f| data(f).ignored.iter())
        .map(|r| r.len())
        .sum();
    let total: usize = report
        .files
        .iter()
        .map(|f| data(f).fingerprints.len())
        .sum();
    assert!(
        (1..total).contains(&ignored),
        "ignored {ignored} of {total} fingerprints"
    );

    for pair in &report.pairs {
        let (left, right) = (data(&pair.left_file), data(&pair.right_file));
        let sequences = vec![left.fingerprints.clone(), right.fingerprints.clone()];
        let positions = vec![left.ignored.clone(), right.ignored.clone()];
        let names = format!(
            "({}, {})",
            pair.left_file.relative_path.display(),
            pair.right_file.relative_path.display()
        );

        let rerun = dolos_core::analyze(&sequences, Some(&positions), &options)
            .expect("the exported data is a valid input");

        assert_eq!(
            rerun.metrics().get(0, 1),
            Some(&pair.metrics),
            "metrics differ for {names}"
        );
    }
}

/// The frequency cap counts the files of the whole corpus, so a rerun of two
/// files cannot apply it again. Without the exported ignored positions the
/// rerun gives other metrics.
#[test]
fn a_rerun_without_the_exported_positions_disagrees() {
    let report = report(SAMPLE123, replay_config());
    let options = analysis_options(&report);
    let pair = &report.pairs[0];

    let (left, right) = (data(&pair.left_file), data(&pair.right_file));
    let sequences = vec![left.fingerprints.clone(), right.fingerprints.clone()];

    let blind = dolos_core::analyze(&sequences, None, &options)
        .expect("the exported data is a valid input");

    assert_ne!(
        blind.metrics().get(0, 1),
        Some(&pair.metrics),
        "the exported ignored positions changed nothing"
    );
}
