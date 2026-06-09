use dolos::config::DolosConfig;
use dolos::dolos::Dolos;
use std::path::PathBuf;

fn js_files(names: &[&str]) -> Vec<PathBuf> {
    names.iter().map(|&s| PathBuf::from(s)).collect()
}

#[test]
fn test_pair_metrics() {
    let report = Dolos::new(
        js_files(&["fixtures/sample1.js", "fixtures/sample2.js"]),
        DolosConfig::default(),
    )
    .unwrap()
    .build_report();

    let metrics = &report.pairs[0].metrics;

    assert_eq!(metrics.similarity, 0.4803921568627451);
    assert_eq!(metrics.total_left, 96);
    assert_eq!(metrics.total_right, 108);
    assert_eq!(metrics.overlap_left, 50);
    assert_eq!(metrics.overlap_right, 48);
    assert_eq!(metrics.longest_fragment, 21);
}

#[test]
fn test_two_files_have_fragments() {
    // With exactly two files, fragments are kept automatically.
    let report = Dolos::new(
        js_files(&["fixtures/sample1.js", "fixtures/sample2.js"]),
        DolosConfig::default(),
    )
    .unwrap()
    .build_report();

    for pair in &report.pairs {
        assert!(
            pair.fragments.is_some(),
            "fragments should be present when exactly 2 files are given"
        );
    }
}

#[test]
fn test_three_files_no_fragments() {
    let report = Dolos::new(
        js_files(&[
            "fixtures/sample1.js",
            "fixtures/sample2.js",
            "fixtures/simple.js",
        ]),
        DolosConfig::default(),
    )
    .unwrap()
    .build_report();

    for pair in &report.pairs {
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
    let files = js_files(&["fixtures/sample1.js", "fixtures/sample2.js"]);

    let similarity_without_ignore = Dolos::new(files.clone(), DolosConfig::default())
        .unwrap()
        .build_report()
        .pairs[0]
        .metrics
        .similarity;

    let similarity_with_ignore = Dolos::new(
        files,
        DolosConfig::builder()
            .ignore("fixtures/sample_ignore.js")
            .build(),
    )
    .unwrap()
    .build_report()
    .pairs[0]
        .metrics
        .similarity;

    assert!(
        similarity_with_ignore < similarity_without_ignore,
        "similarity with ignore ({similarity_with_ignore}) should be less than \
         without ignore ({similarity_without_ignore})"
    );
}
