use dolos::dolos::{Dolos, DolosConfig};

#[test]
fn test_pair_metrics() {
    let paths = vec!["fixtures/sample1.js".into(), "fixtures/sample2.js".into()];

    let report = Dolos::from_paths(paths, DolosConfig::default()).build_report();
    let metrics = report
        .iter_pairs()
        .next()
        .expect("should have one pair")
        .metrics;

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
    let report = Dolos::from_paths(paths, DolosConfig::default()).build_report();

    for pair in report.iter_pairs() {
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
    let report = Dolos::from_paths(paths, DolosConfig::default()).build_report();

    for pair in report.iter_pairs() {
        assert!(
            pair.fragments.is_none(),
            "fragments should be None when more than 2 files are given"
        );
    }
}
