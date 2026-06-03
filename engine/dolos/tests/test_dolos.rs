use dolos::dolos::Dolos;
use dolos::file::FileSet;
use dolos::opts::{IndexConfig, ReportConfig};
use std::path::PathBuf;
use tree_sitter_grammars::Language;

fn default_config() -> IndexConfig {
    IndexConfig {
        kgram_length: 23,
        kgrams_in_window: 17,
        language: Language::Javascript,
        keep_fragments: false,
        include_comments: false,
        max_fingerprint_file_count: None,
        ignore: None,
        min_length_match: 1,
    }
}

fn default_report_config() -> ReportConfig {
    ReportConfig { sort_by: None, fragment_sort_by: None }
}

fn file_set(paths: &[&str]) -> FileSet {
    FileSet {
        base_dir: PathBuf::new(),
        relative_paths: paths.iter().map(PathBuf::from).collect(),
    }
}

#[test]
fn test_pair_metrics() {
    let report = Dolos::from_file_set(
        file_set(&["fixtures/sample1.js", "fixtures/sample2.js"]),
        IndexConfig { keep_fragments: true, ..default_config() },
    )
    .build_report(default_report_config());

    let metrics = report.all_pairs()[0].metrics;

    assert_eq!(metrics.similarity, 0.4803921568627451);
    assert_eq!(metrics.total_left, 96);
    assert_eq!(metrics.total_right, 108);
    assert_eq!(metrics.overlap_left, 50);
    assert_eq!(metrics.overlap_right, 48);
    assert_eq!(metrics.longest_fragment, 21);
}

#[test]
fn test_two_files_have_fragments() {
    let report = Dolos::from_file_set(
        file_set(&["fixtures/sample1.js", "fixtures/sample2.js"]),
        IndexConfig { keep_fragments: true, ..default_config() },
    )
    .build_report(default_report_config());

    for pair in report.all_pairs() {
        assert!(
            pair.fragments.is_some(),
            "fragments should be None when more than 2 files are given"
        );
    }
}

#[test]
fn test_three_files_no_fragments() {
    let report = Dolos::from_file_set(
        file_set(&[
            "fixtures/sample1.js",
            "fixtures/sample2.js",
            "fixtures/simple.js",
        ]),
        default_config(),
    )
    .build_report(default_report_config());

    for pair in report.all_pairs() {
        assert!(
            pair.fragments.is_none(),
            "fragments should be None when more than 2 files are given"
        );
    }
}

/// Verifies that the `--ignore` option suppresses similarity contributed by
/// boilerplate code that appears in both files.
///
/// `sample1.js` and `sample2.js` share several code fragments. `sample_ignore.js`
/// contains a subset of that shared code (the two setter/getter methods). With
/// `ignore` set to `sample_ignore.js`, those fragments must be suppressed, so
/// the measured similarity between the two student files must be strictly lower
/// than without the ignored file.
#[test]
fn test_ignore() {
    let file_set = file_set(&["fixtures/sample1.js", "fixtures/sample2.js"]);

    let similarity_without_ignore = Dolos::from_file_set(file_set.clone(), default_config())
        .build_report(default_report_config())
        .all_pairs()[0]
        .metrics
        .similarity;

    let similarity_with_ignore = Dolos::from_file_set(
        file_set,
        IndexConfig {
            ignore: Some("fixtures/sample_ignore.js".into()),
            ..default_config()
        },
    )
    .build_report(default_report_config())
    .all_pairs()[0]
        .metrics
        .similarity;

    assert!(
        similarity_with_ignore < similarity_without_ignore,
        "similarity with ignore ({similarity_with_ignore}) should be less than \
         without ignore ({similarity_without_ignore})"
    );
}
