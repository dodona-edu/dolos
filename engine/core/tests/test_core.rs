use dolos_core::{AnalysisOptions, AnalysisResult, Match, PairMetrics, analyze};

fn matches(result: &AnalysisResult, i: usize, j: usize) -> &[Match] {
    &result.matches().unwrap()[(i, j)]
}

// The run `2 3 4` covers 3 of the 5 symbols on each side: 6 of 10.
#[test]
fn shared_run_gives_the_metrics_of_the_pair() {
    let sequences = vec![vec![1, 2, 3, 4, 5], vec![9, 9, 2, 3, 4]];
    let options = AnalysisOptions { min_match_length: 1, keep_matches: false };
    let result = analyze(&sequences, None, &options).unwrap();

    let expected = PairMetrics {
        similarity: 0.6,
        total_left: 5,
        total_right: 5,
        overlap_left: 3,
        overlap_right: 3,
        longest_match: 3,
    };
    assert_eq!(result.metrics()[(0, 1)], expected);
}

#[test]
fn reversed_pair_query_keeps_the_lower_index_on_the_left() {
    let sequences = vec![vec![7, 1, 2, 3], vec![1, 2, 3]];
    let options = AnalysisOptions { min_match_length: 1, keep_matches: true };
    let result = analyze(&sequences, None, &options).unwrap();

    let expected = Match { left_start: 1, right_start: 0, length: 3 };
    assert_eq!(matches(&result, 1, 0), [expected]);
}

// The longest match of each pair shows that the indices name the right pair.
#[test]
fn iter_pairs_yields_every_pair_once_in_index_order() {
    let sequences = vec![vec![1, 2, 3], vec![1, 2], vec![5], vec![2, 3]];
    let options = AnalysisOptions { min_match_length: 1, keep_matches: false };
    let result = analyze(&sequences, None, &options).unwrap();

    let longest: Vec<(usize, usize, usize)> = result
        .metrics()
        .iter_pairs()
        .map(|(i, j, m)| (i, j, m.longest_match))
        .collect();
    assert_eq!(
        longest,
        [
            (0, 1, 2),
            (0, 2, 0),
            (0, 3, 2),
            (1, 2, 0),
            (1, 3, 1),
            (2, 3, 0)
        ]
    );
}

#[test]
fn keep_matches_off_leaves_out_the_matches() {
    let sequences = vec![vec![1, 2, 3, 4], vec![9, 2, 3, 4]];
    let options = AnalysisOptions { min_match_length: 1, keep_matches: false };
    let result = analyze(&sequences, None, &options).unwrap();

    assert!(result.matches().is_none());
}

#[test]
fn keep_matches_does_not_change_the_metrics() {
    let sequences = vec![vec![1, 2, 3, 4], vec![9, 2, 3, 4]];
    let with_options = AnalysisOptions { min_match_length: 1, keep_matches: true };
    let without_options = AnalysisOptions { min_match_length: 1, keep_matches: false };
    let with_matches = analyze(&sequences, None, &with_options).unwrap();
    let without_matches = analyze(&sequences, None, &without_options).unwrap();

    assert_eq!(
        without_matches.metrics()[(0, 1)],
        with_matches.metrics()[(0, 1)]
    );
}

#[test]
fn empty_sequences_have_no_similarity() {
    let sequences = vec![vec![], vec![]];
    let options = AnalysisOptions { min_match_length: 1, keep_matches: false };
    let result = analyze(&sequences, None, &options).unwrap();

    assert_eq!(result.metrics()[(0, 1)], PairMetrics::default());
}

// The ranges cover positions 0, 1 and 2, so 1 of the 4 positions is left.
#[test]
fn overlapping_ignored_ranges_count_each_position_once() {
    let sequences = vec![vec![1, 2, 3, 4], vec![5, 6]];
    let ignored = [vec![0..2, 1..3], vec![]];
    let options = AnalysisOptions { min_match_length: 1, keep_matches: false };
    let result = analyze(&sequences, Some(&ignored), &options).unwrap();

    assert_eq!(result.metrics()[(0, 1)].total_left, 1);
}
