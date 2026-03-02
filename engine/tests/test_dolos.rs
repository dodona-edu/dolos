use dolos::dolos::Dolos;

#[test]
fn test_similarity_fixtures() {
    let paths = vec![
        "fixtures/sample1.js".into(),
        "fixtures/sample2.js".into(),
    ];

    let report = Dolos::from_paths(paths).build_report();
    assert_eq!(*report.analysis_result.similarities.get(0, 1),0.4803921568627451);
}