use dolos::dolos::Dolos;
use dolos::opts::{ResolvedIndexConfig, ResolvedReportArgs};
use tree_sitter_grammars::Language;

fn default_config() -> ResolvedIndexConfig {
    ResolvedIndexConfig {
        kgram_length: 23,
        kgrams_in_window: 17,
        language: Language::Javascript,
        keep_fragments: false,
        include_comments: false,
        max_fingerprint_count: None,
        max_fingerprint_percentage: Some(0.9),
        ignore: None,
    }
}

fn default_report_config() -> ResolvedReportArgs {
    ResolvedReportArgs { sort_by: None, fragment_sort_by: None }
}

#[test]
fn test_pair_metrics() {
    let paths = vec!["fixtures/sample1.js".into(), "fixtures/sample2.js".into()];
    let report = Dolos::from_paths(
        paths,
        ResolvedIndexConfig { keep_fragments: true, ..default_config() },
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
    let paths = vec!["fixtures/sample1.js".into(), "fixtures/sample2.js".into()];
    let report = Dolos::from_paths(
        paths,
        ResolvedIndexConfig { keep_fragments: true, ..default_config() },
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
    let paths = vec![
        "fixtures/sample1.js".into(),
        "fixtures/sample2.js".into(),
        "fixtures/simple.js".into(),
    ];
    let report = Dolos::from_paths(paths, default_config()).build_report(default_report_config());

    for pair in report.all_pairs() {
        assert!(
            pair.fragments.is_none(),
            "fragments should be None when more than 2 files are given"
        );
    }
}
