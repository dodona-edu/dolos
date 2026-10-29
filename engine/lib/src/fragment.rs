use crate::config::FragmentSortBy;
use crate::winnowing::region::Region;
use dolos_core::{Match, PairArray};
use std::cmp::Reverse;

/// A resolved code fragment: the source regions that correspond to one
/// maximal exact match in both files.
#[derive(Debug, Clone)]
pub struct Fragment {
    /// The region in the left file covered by this match.
    pub left_region: Region,
    /// The region in the right file covered by this match.
    pub right_region: Region,
    /// Number of fingerprints in this match.
    pub fingerprint_count: usize,
}

impl Fragment {
    /// Resolve a raw [`Match`] into a [`Fragment`] using per-file fingerprint
    /// location arrays.
    pub fn resolve(m: &Match, left_locs: &[Region], right_locs: &[Region]) -> Self {
        Fragment {
            left_region: Region::span(
                &left_locs[m.left_start],
                &left_locs[m.left_start + m.length - 1],
            ),
            right_region: Region::span(
                &right_locs[m.right_start],
                &right_locs[m.right_start + m.length - 1],
            ),
            fingerprint_count: m.length,
        }
    }
}

/// Resolve raw matches into [`Fragment`] lists using the per-file fingerprint
/// regions, sorted according to `sort_by`.
///
/// `locations` is indexed by file id, exactly like the sequences that were
/// handed to the analysis.
pub fn resolve_fragments(
    raw_matches: &PairArray<Vec<Match>>,
    locations: &[Vec<Region>],
    sort_by: &Option<FragmentSortBy>,
) -> PairArray<Vec<Fragment>> {
    raw_matches.map(|left, right, pair_matches| {
        let mut resolved: Vec<Fragment> = pair_matches
            .iter()
            .map(|m| Fragment::resolve(m, &locations[left], &locations[right]))
            .collect();
        sort_fragments(&mut resolved, sort_by);
        resolved
    })
}

/// Sort fragments in-place according to `sort_by`.
///
/// `FileOrder` and `None` both sort by left-file source position (row, column).
fn sort_fragments(fragments: &mut [Fragment], sort_by: &Option<FragmentSortBy>) {
    match sort_by {
        Some(FragmentSortBy::KgramsAscending) => {
            fragments.sort_by_key(|f| f.fingerprint_count);
        }
        Some(FragmentSortBy::KgramsDescending) => {
            fragments.sort_by_key(|f| Reverse(f.fingerprint_count));
        }
        Some(FragmentSortBy::FileOrder) | None => {
            fragments.sort_by_key(|f| {
                (
                    f.left_region.start_point.row,
                    f.left_region.start_point.column,
                )
            });
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::winnowing::region::Point;
    use dolos_core::{AnalysisOptions, AnalysisResult};
    use rstest::rstest;

    #[test]
    fn resolve_maps_match_to_regions() {
        let left_locs = vec![
            Region::new(Point::new(10, 0), Point::new(10, 10)),
            Region::new(Point::new(11, 0), Point::new(12, 12)),
        ];
        let right_locs = vec![
            Region::new(Point::new(20, 0), Point::new(20, 10)),
            Region::new(Point::new(21, 0), Point::new(22, 12)),
        ];
        let m = Match { left_start: 0, right_start: 0, length: 2 };

        let frag = Fragment::resolve(&m, &left_locs, &right_locs);

        let expected_left_region = Region::new(Point::new(10, 0), Point::new(12, 12));
        let expected_right_region = Region::new(Point::new(20, 0), Point::new(22, 12));

        assert_eq!(frag.left_region, expected_left_region);
        assert_eq!(frag.right_region, expected_right_region);
        assert_eq!(frag.fingerprint_count, 2);
    }

    /// One region per fingerprint, `count` fingerprints per file.
    fn locations(count: usize) -> Vec<Vec<Region>> {
        vec![
            (0..count)
                .map(|r| Region::new(Point::new(r, 0), Point::new(r, 5)))
                .collect(),
            (10..10 + count)
                .map(|r| Region::new(Point::new(r, 0), Point::new(r, 5)))
                .collect(),
        ]
    }

    /// The analysis of two sequences, with the matches kept.
    fn analyze_pair(left: Vec<usize>, right: Vec<usize>) -> AnalysisResult {
        let options = AnalysisOptions { min_match_length: 1, keep_matches: true };
        dolos_core::analyze(&[left, right], None, &options).unwrap()
    }

    /// A pair's matches become fragments spanning from the first fingerprint's
    /// region to the last one's.
    #[test]
    fn resolve_fragments_spans_every_match_of_a_pair() {
        let result = analyze_pair(vec![1, 2], vec![1, 2]);

        let fragments = resolve_fragments(result.matches().unwrap(), &locations(2), &None);
        let frags = fragments.get(0, 1);

        assert_eq!(frags.len(), 1);
        assert_eq!(frags[0].fingerprint_count, 2);
        assert_eq!(frags[0].left_region.start_point, Point::new(0, 0));
        assert_eq!(frags[0].left_region.end_point, Point::new(1, 5));
        assert_eq!(frags[0].right_region.start_point, Point::new(10, 0));
        assert_eq!(frags[0].right_region.end_point, Point::new(11, 5));
    }

    #[rstest]
    #[case(Some(FragmentSortBy::KgramsAscending), vec![1, 2])]
    #[case(Some(FragmentSortBy::KgramsDescending), vec![2, 1])]
    #[case(Some(FragmentSortBy::FileOrder), vec![2, 1])]
    #[case(None, vec![2, 1])]
    fn resolve_fragments_sorts_as_requested(
        #[case] sort_by: Option<FragmentSortBy>,
        #[case] expected: Vec<usize>,
    ) {
        // One match of length 2 at the start, one of length 1 at the end.
        let result = analyze_pair(vec![2, 3, 9, 1], vec![2, 3, 8, 1]);
        let mut matches = result.matches().unwrap().get(0, 1).clone();
        matches.sort_by_key(|m| m.left_start);
        assert_eq!(
            matches,
            vec![
                Match { left_start: 0, right_start: 0, length: 2 },
                Match { left_start: 3, right_start: 3, length: 1 },
            ]
        );

        let fragments = resolve_fragments(result.matches().unwrap(), &locations(4), &sort_by);
        let counts: Vec<usize> = fragments
            .get(0, 1)
            .iter()
            .map(|f| f.fingerprint_count)
            .collect();

        assert_eq!(counts, expected);
    }
}
