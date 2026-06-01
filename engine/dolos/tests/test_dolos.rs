use dolos::dolos::{Dolos, DolosConfig};
use dolos::file::FileSet;
use std::path::PathBuf;

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
        DolosConfig::default(),
    )
    .build_report();
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
    let report = Dolos::from_file_set(
        file_set(&["fixtures/sample1.js", "fixtures/sample2.js"]),
        DolosConfig::default(),
    )
    .build_report();

    for pair in report.iter_pairs() {
        assert!(
            pair.fragments.is_some(),
            "fragments should be present for 2 files"
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
        DolosConfig::default(),
    )
    .build_report();

    for pair in report.iter_pairs() {
        assert!(
            pair.fragments.is_none(),
            "fragments should be None for more than 2 files"
        );
    }
}
