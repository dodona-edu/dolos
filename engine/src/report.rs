use crate::collections::pair_array::PairArray;
use crate::file::File;
use crate::fragment::Fragment;
use crate::suffixtree::types::{AnalysisResult, Match};
use crate::winnowing::region::Region;
use std::rc::Rc;

/// A single file-pair result, ready for display or output.
pub struct Pair<'a> {
    pub left_file: &'a File,
    pub right_file: &'a File,
    pub similarity: f64,
    pub longest_fragment: usize,
    /// Resolved source-line fragments, present when fragment storage was enabled.
    pub fragments: Option<&'a [Fragment]>,
}

pub struct Report {
    /// Similarity scores between pairs of inputs (indexed as [i1][i2] where i1 < i2).
    similarities: PairArray<f64>,
    /// Length of the longest common substring between pairs.
    longest_fragments: PairArray<usize>,
    files: Vec<Rc<File>>,
    /// Resolved per-pair fragments, produced at construction time from raw
    /// matches and locations, which are then dropped.
    fragments: Option<PairArray<Vec<Fragment>>>,
}

impl Report {
    /// Build a report by resolving raw matches against location data.
    ///
    /// The raw matches and locations are consumed to produce resolved
    /// [`Fragment`]s and then dropped.
    pub(crate) fn from(
        analysis_result: AnalysisResult,
        files: Vec<Rc<File>>,
        locations: Option<Vec<Vec<Region>>>,
    ) -> Report {
        let AnalysisResult { similarities, longest_fragments, matches } = analysis_result;
        let fragments = Self::resolve_fragments(matches, locations);
        Report { similarities, longest_fragments, files, fragments }
    }

    /// Resolve raw matches + locations into sorted [`Fragment`] lists.
    fn resolve_fragments(
        raw_matches: Option<PairArray<Vec<Match>>>,
        locations: Option<Vec<Vec<Region>>>,
    ) -> Option<PairArray<Vec<Fragment>>> {
        let (raw, locs) = match (raw_matches, locations) {
            (Some(m), Some(l)) => (m, l),
            _ => return None,
        };

        let size = raw.size();
        let mut fragments = PairArray::new(size, Vec::new());

        for (left, right, pair_matches) in raw.iter_pairs() {
            let mut resolved: Vec<Fragment> = pair_matches
                .iter()
                .map(|m| Fragment::resolve(m, left, right, &locs[left], &locs[right]))
                .collect();
            resolved.sort_by_key(|f| f.left_region.start_point.row);
            fragments.set(left, right, resolved);
        }

        Some(fragments)
    }

    /// Iterates over every unordered pair of files, yielding a [`Pair`] with
    /// precomputed similarity, longest-fragment, and resolved fragments.
    pub fn iter_pairs(&self) -> impl Iterator<Item = Pair<'_>> {
        let files = self.files.as_slice();
        let longest_fragments = &self.longest_fragments;
        let fragments = self.fragments.as_ref();
        self.similarities
            .iter_pairs()
            .map(move |(left, right, similarity)| Pair {
                left_file: &files[left],
                right_file: &files[right],
                similarity: *similarity,
                longest_fragment: *longest_fragments.get(left, right),
                fragments: fragments.map(|f| f.get(left, right).as_slice()),
            })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::language::Language;
    use crate::suffixtree::types::{Match, StartPosition};
    use crate::winnowing::region::Point;
    use std::path::PathBuf;

    fn make_region(start_row: usize, end_row: usize) -> Region {
        Region::new(0, 10, Point::new(start_row, 0), Point::new(end_row, 0))
    }

    fn two_files() -> Vec<Rc<File>> {
        vec![
            Rc::new(File {
                path: PathBuf::from("a.js"),
                language: Language::Javascript,
                content: None,
            }),
            Rc::new(File {
                path: PathBuf::from("b.js"),
                language: Language::Javascript,
                content: None,
            }),
        ]
    }

    fn base_analysis(matches: Option<PairArray<Vec<Match>>>) -> AnalysisResult {
        let mut similarities = PairArray::new(2, 0.0);
        similarities.set(0, 1, 0.5);
        let mut longest_fragments = PairArray::new(2, 0);
        longest_fragments.set(0, 1, 3);
        AnalysisResult { similarities, longest_fragments, matches }
    }

    // ── Report / Pair iteration tests ────────────────────────────────

    #[test]
    fn iter_pairs_without_fragments() {
        let report = Report::from(base_analysis(None), two_files(), None);
        let pairs: Vec<_> = report.iter_pairs().collect();

        assert_eq!(pairs.len(), 1);
        assert_eq!(pairs[0].similarity, 0.5);
        assert_eq!(pairs[0].longest_fragment, 3);
        assert!(pairs[0].fragments.is_none());
    }

    #[test]
    fn iter_pairs_with_resolved_fragments() {
        let mut match_array = PairArray::new(2, Vec::new());
        match_array.set(
            0,
            1,
            vec![Match::new(
                StartPosition { word_index: 0, start: 0 },
                StartPosition { word_index: 1, start: 0 },
                2,
            )],
        );

        let locations = vec![
            vec![make_region(0, 0), make_region(1, 2)],
            vec![make_region(5, 5), make_region(6, 7)],
        ];

        let report = Report::from(
            base_analysis(Some(match_array)),
            two_files(),
            Some(locations),
        );
        let pairs: Vec<_> = report.iter_pairs().collect();

        let frags = pairs[0].fragments.expect("fragments should be present");
        assert_eq!(frags.len(), 1);
        assert_eq!(frags[0].left_region.start_point.row, 0);
        assert_eq!(frags[0].left_region.end_point.row, 2);
        assert_eq!(frags[0].right_region.start_point.row, 5);
        assert_eq!(frags[0].right_region.end_point.row, 7);
        assert_eq!(frags[0].fingerprint_count, 2);
    }

    #[test]
    fn fragments_sorted_by_left_position() {
        let mut match_array = PairArray::new(2, Vec::new());
        match_array.set(
            0,
            1,
            vec![
                Match::new(
                    StartPosition { word_index: 0, start: 2 },
                    StartPosition { word_index: 1, start: 0 },
                    1,
                ),
                Match::new(
                    StartPosition { word_index: 0, start: 0 },
                    StartPosition { word_index: 1, start: 2 },
                    1,
                ),
            ],
        );

        let locations = vec![
            vec![make_region(10, 10), make_region(5, 5), make_region(20, 20)],
            vec![make_region(0, 0), make_region(1, 1), make_region(2, 2)],
        ];

        let report = Report::from(
            base_analysis(Some(match_array)),
            two_files(),
            Some(locations),
        );
        let frags = report
            .iter_pairs()
            .next()
            .unwrap()
            .fragments
            .expect("fragments should be present");

        assert!(
            frags[0].left_region.start_point.row <= frags[1].left_region.start_point.row,
            "fragments should be sorted by left start row"
        );
    }
}
