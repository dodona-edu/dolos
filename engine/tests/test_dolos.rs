use dolos::dolos::{Dolos, DolosConfig};

#[test]
fn test_similarity_fixtures() {
    let paths = vec!["fixtures/sample1.js".into(), "fixtures/sample2.js".into()];

    let report = Dolos::from_paths(paths, DolosConfig::default()).build_report();
    let pair = report.iter_pairs().next().expect("should have one pair");
    let m = pair.metrics;

    let epsilon = 1e-9_f64;
    assert!(
        (m.similarity - 0.4803921568627451_f64).abs() < epsilon,
        "similarity {} not within {} of expected 0.4803921568627451",
        m.similarity,
        epsilon,
    );
    assert_eq!(m.total_left, 96, "total_left");
    assert_eq!(m.total_right, 108, "total_right");
    assert_eq!(m.overlap_left, 50, "overlap_left");
    assert_eq!(m.overlap_right, 48, "overlap_right");
    assert_eq!(m.longest_fragment, 21, "longest_fragment");
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
#[test]
fn print_all_metrics() {
    let paths = vec!["fixtures/sample1.js".into(), "fixtures/sample2.js".into()];
    let report = Dolos::from_paths(paths, DolosConfig::default()).build_report();
    let pair = report.iter_pairs().next().unwrap();
    let m = pair.metrics;
    println!("similarity:       {:?}", m.similarity);
    println!("total_left:       {:?}", m.total_left);
    println!("total_right:      {:?}", m.total_right);
    println!("overlap_left:     {:?}", m.overlap_left);
    println!("overlap_right:    {:?}", m.overlap_right);
    println!("longest_fragment: {:?}", m.longest_fragment);
}
