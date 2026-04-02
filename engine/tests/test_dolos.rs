use dolos::dolos::{Dolos, DolosConfig};

#[test]
fn test_similarity_fixtures() {
    let paths = vec!["fixtures/sample1.js".into(), "fixtures/sample2.js".into()];

    let report = Dolos::from_paths(paths, DolosConfig::default()).build_report();
    let pair = report.iter_pairs().next().expect("should have one pair");
    let expected = 0.4803921568627451_f64;
    let epsilon = 1e-9_f64;
    assert!(
        (pair.similarity - expected).abs() < epsilon,
        "similarity {} not within {} of expected {}",
        pair.similarity,
        epsilon,
        expected
    );
}

#[test]
fn test_two_files_have_fragments() {
    let paths = vec!["fixtures/sample1.js".into(), "fixtures/sample2.js".into()];
    let report = Dolos::from_paths(paths, DolosConfig::default()).build_report();

    let pairs: Vec<_> = report.iter_pairs().collect();
    assert_eq!(pairs.len(), 1);

    // With exactly 2 files, resolved fragments should be present.
    let fragments = pairs[0]
        .fragments
        .expect("fragments should be present for 2 files");
    assert!(
        !fragments.is_empty(),
        "there should be at least one fragment between sample files"
    );
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
