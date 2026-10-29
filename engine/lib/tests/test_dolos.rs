use dolos::{AnalysisData, Dolos, DolosConfig, File, Language, PairSortBy, Report};
use dolos_core::AnalysisOptions;
use rstest::rstest;
use std::path::PathBuf;

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
        .expect("the report holds the pair (sample1.js, sample2.js)")
        .metrics
        .similarity
}

fn is_sorted_desc<T, K: PartialOrd>(items: &[T], key: impl Fn(&T) -> K) -> bool {
    items.windows(2).all(|w| key(&w[0]) >= key(&w[1]))
}

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
fn analysis_data(file: &File) -> &AnalysisData {
    file.analysis_data.as_ref().unwrap()
}

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
fn config_gives_the_expected_similarity(
    #[case] files: &[&str],
    #[case] config: DolosConfig,
    #[case] expected_sim: f64,
) {
    assert_eq!(pair_sim(files, config), expected_sim);
}

#[test]
fn two_files_have_fragments() {
    let report = report(SAMPLE12, DolosConfig::default());

    for pair in &report.pairs {
        assert!(pair.fragments.is_some());
    }
}

#[test]
fn three_files_have_no_fragments() {
    let report = report(SAMPLE123, DolosConfig::default());

    for pair in &report.pairs {
        assert!(pair.fragments.is_none());
    }
}

#[rstest]
#[case::similarity(PairSortBy::Similarity)]
#[case::total_overlap(PairSortBy::TotalOverlap)]
#[case::longest_fragment(PairSortBy::LongestFragment)]
fn pairs_are_sorted_in_descending_order(#[case] sort_by: PairSortBy) {
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
    assert!(ordered);
}

// Each input holds the same two files as `SAMPLE12`.
#[rstest]
#[case::directory("fixtures/reader")]
#[case::csv("fixtures/reader/info.csv")]
#[case::zip("fixtures/reader.zip")]
#[case::tar("fixtures/reader.tar")]
#[case::tar_gz("fixtures/reader.tar.gz")]
#[case::tar_bz2("fixtures/reader.tar.bz2")]
fn input_mode_gives_the_same_similarity(#[case] input: &str) {
    assert_eq!(
        pair_sim(&[input], DolosConfig::default()),
        pair_sim(SAMPLE12, DolosConfig::default())
    );
}

#[test]
fn detected_language_skips_other_files() {
    let report = Dolos::new(to_path_buf(MIXED), DolosConfig::default())
        .unwrap()
        .build_report();

    assert_eq!(
        kept_paths(&report),
        to_path_buf(&["fixtures/sample1.js", "fixtures/sample2.js"])
    );
}

#[test]
fn tied_languages_are_ambiguous() {
    let err = Dolos::new(to_path_buf(JS_AND_PY), DolosConfig::default()).unwrap_err();
    assert!(err.to_string().contains("[Javascript, Python]"), "{err}");
}

#[test]
fn explicit_language_skips_other_files() {
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
fn too_few_files_after_filtering_are_rejected() {
    let config = DolosConfig::builder()
        .language(Language::Python)
        .build()
        .unwrap();
    let err = Dolos::new(to_path_buf(MIXED), config).unwrap_err();

    assert!(err.to_string().contains("at least 2 Python files"), "{err}");
}

#[test]
fn analysis_data_is_absent_by_default() {
    let report = report(SAMPLE12, DolosConfig::default());

    for file in &report.files {
        assert!(file.analysis_data.is_none());
    }
}

#[test]
fn analysis_data_holds_a_region_per_fingerprint() {
    let config = DolosConfig::builder()
        .include_analysis_data(true)
        .build()
        .unwrap();
    let report = report(SAMPLE123, config);

    assert_eq!(report.files.len(), 3);
    for file in &report.files {
        let data = analysis_data(file);

        assert!(!data.fingerprints.is_empty());
        assert_eq!(data.fingerprints.len(), data.regions.len());
    }
}

#[test]
fn analysis_data_ignores_nothing_without_a_template_or_cap() {
    let config = DolosConfig::builder()
        .include_analysis_data(true)
        .build()
        .unwrap();
    let report = report(SAMPLE123, config);

    for file in &report.files {
        assert!(analysis_data(file).ignored.is_empty());
    }
}

#[test]
fn template_shows_up_as_ignored_intervals() {
    let config = DolosConfig::builder()
        .include_analysis_data(true)
        .ignore(IGNORE)
        .build()
        .unwrap();
    let report = report(SAMPLE12, config);

    for file in &report.files {
        let data = analysis_data(file);
        let ignored: usize = data.ignored.iter().map(|r| r.len()).sum();

        let path = file.relative_path.display();
        assert!(
            !data.ignored.is_empty(),
            "the template ignores nothing in {path}"
        );
        assert!(
            ignored < data.fingerprints.len(),
            "everything is ignored in {path}"
        );
    }
}

// The intervals are maximal runs, so they never touch.
#[test]
fn ignored_intervals_never_touch() {
    let config = DolosConfig::builder()
        .include_analysis_data(true)
        .ignore(IGNORE)
        .build()
        .unwrap();
    let report = report(SAMPLE12, config);

    for file in &report.files {
        let data = analysis_data(file);

        assert!(
            data.ignored.windows(2).all(|w| w[0].end < w[1].start),
            "two intervals touch in {}",
            file.relative_path.display()
        );
    }
}

#[test]
fn ignored_intervals_stay_inside_the_file() {
    let config = DolosConfig::builder()
        .include_analysis_data(true)
        .ignore(IGNORE)
        .build()
        .unwrap();
    let report = report(SAMPLE12, config);

    for file in &report.files {
        let data = analysis_data(file);

        assert!(
            data.ignored
                .iter()
                .all(|r| r.end <= data.fingerprints.len()),
            "an interval ends past the fingerprints in {}",
            file.relative_path.display()
        );
    }
}

#[test]
fn inert_template_ignores_nothing() {
    let config = DolosConfig::builder()
        .include_analysis_data(true)
        .ignore(IGNORE_INERT)
        .build()
        .unwrap();
    let report = report(SAMPLE12, config);

    for file in &report.files {
        assert!(analysis_data(file).ignored.is_empty());
    }
}

// A pair analysed again from its exported data gives the metrics of the full run.
#[test]
fn replayed_pair_reproduces_the_run() {
    let report = report(SAMPLE123, replay_config());
    let options = analysis_options(&report);

    // The cap must ignore something without swallowing the corpus, or this
    // proves nothing.
    let ignored: usize = report
        .files
        .iter()
        .flat_map(|f| analysis_data(f).ignored.iter())
        .map(|r| r.len())
        .sum();
    let total: usize = report
        .files
        .iter()
        .map(|f| analysis_data(f).fingerprints.len())
        .sum();
    assert!(
        (1..total).contains(&ignored),
        "ignored {ignored} of {total} fingerprints"
    );

    for pair in &report.pairs {
        let (left, right) = (
            analysis_data(&pair.left_file),
            analysis_data(&pair.right_file),
        );
        let sequences = vec![left.fingerprints.clone(), right.fingerprints.clone()];
        let positions = vec![left.ignored.clone(), right.ignored.clone()];
        let names = format!(
            "({}, {})",
            pair.left_file.relative_path.display(),
            pair.right_file.relative_path.display()
        );

        let rerun = dolos_core::analyze(&sequences, Some(&positions), &options).unwrap();

        assert_eq!(
            rerun.metrics().get(0, 1),
            Some(&pair.metrics),
            "metrics differ for {names}"
        );
    }
}

// The cap counts the files of the whole corpus, so a rerun of two files cannot apply it again.
#[test]
fn rerun_without_the_exported_positions_disagrees() {
    let report = report(SAMPLE123, replay_config());
    let options = analysis_options(&report);
    let pair = &report.pairs[0];

    let (left, right) = (
        analysis_data(&pair.left_file),
        analysis_data(&pair.right_file),
    );
    let sequences = vec![left.fingerprints.clone(), right.fingerprints.clone()];

    let blind = dolos_core::analyze(&sequences, None, &options).unwrap();

    assert_ne!(blind.metrics().get(0, 1), Some(&pair.metrics));
}
