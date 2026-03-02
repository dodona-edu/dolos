use dolos::dolos::Dolos;

#[test]
fn test_similarity_fixtures() {
    let paths = vec![
        "fixtures/sample1.js".into(),
        "fixtures/sample2.js".into(),
    ];

    let report = Dolos::from_paths(paths).build_report();
    let similarity = *report.analysis_result.similarities.get(0, 1);
    let expected = 0.4803921568627451_f64;
    let epsilon = 1e-9_f64;
    assert!(
        (similarity - expected).abs() < epsilon,
        "similarity {} not within {} of expected {}",
        similarity,
        epsilon,
        expected
    );
}