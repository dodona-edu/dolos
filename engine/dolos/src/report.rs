use crate::collections::pair_array::PairArray;
use crate::config::{FragmentSortBy, PairSortBy};
use crate::file::File;
use crate::fragment::Fragment;
use crate::metadata::Metadata;
use crate::suffixtree::types::{AnalysisResult, Match, PairMetrics};
use crate::winnowing::region::Region;
use std::cmp::Reverse;
use std::rc::Rc;

/// A single file-pair result, ready for display or output.
pub struct Pair {
    pub left_file: Rc<File>,
    pub right_file: Rc<File>,
    pub metrics: PairMetrics,
    /// Resolved source-line fragments, present when fragment storage was enabled.
    pub fragments: Option<Vec<Fragment>>,
}

pub struct Report {
    pub metadata: Metadata,
    pub files: Vec<Rc<File>>,
    pub pairs: Vec<Pair>,
}

impl Report {
    /// Build a report by resolving raw matches against location data and sorting.
    ///
    /// The raw matches and locations are consumed to produce resolved
    /// [`Fragment`]s, which are then sorted and stored alongside the pair metrics.
    pub(crate) fn new(
        analysis_result: AnalysisResult,
        files: Vec<Rc<File>>,
        locations: Option<Vec<Vec<Region>>>,
        metadata: Metadata,
    ) -> Report {
        let AnalysisResult { metrics, matches } = analysis_result;
        let mut frags = matches
            .zip(locations)
            .map(|(m, l)| Self::resolve_fragments(m, l, &metadata.fragment_sort_by));

        let mut pairs: Vec<Pair> = metrics
            .iter_pairs()
            .map(|(left, right, metric)| Pair {
                left_file: files[left].clone(),
                right_file: files[right].clone(),
                metrics: metric.clone(),
                fragments: frags
                    .as_mut()
                    .map(|f| std::mem::take(f.get_mut(left, right))),
            })
            .collect();

        sort_pairs(&mut pairs, &metadata.sort_by);

        Report { metadata, files, pairs }
    }

    /// Resolve raw matches + locations into [`Fragment`] lists, sorted according
    /// to `fragment_sort_by`.
    ///
    /// `FileOrder` and `None` both sort by left-file source position (row, column).
    fn resolve_fragments(
        raw_matches: PairArray<Vec<Match>>,
        locations: Vec<Vec<Region>>,
        fragment_sort_by: &Option<FragmentSortBy>,
    ) -> PairArray<Vec<Fragment>> {
        let mut fragments = PairArray::new(raw_matches.size(), Vec::new());

        for (left, right, pair_matches) in raw_matches.iter_pairs() {
            let mut resolved: Vec<Fragment> = pair_matches
                .iter()
                .map(|m| Fragment::resolve(m, &locations[left], &locations[right]))
                .collect();
            sort_fragments(&mut resolved, fragment_sort_by);
            fragments.set(left, right, resolved);
        }

        fragments
    }
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

/// Sort pairs in-place according to `sort_by`, descending by the chosen metric.
///
/// When `sort_by` is `None` the natural index order is preserved.
fn sort_pairs(pairs: &mut [Pair], sort_by: &Option<PairSortBy>) {
    match sort_by {
        Some(PairSortBy::Similarity) => {
            pairs.sort_by(|a, b| {
                b.metrics
                    .similarity
                    .partial_cmp(&a.metrics.similarity)
                    .unwrap_or(std::cmp::Ordering::Equal)
            });
        }
        Some(PairSortBy::TotalOverlap) => {
            pairs.sort_by_key(|p| Reverse(p.metrics.overlap_left + p.metrics.overlap_right));
        }
        Some(PairSortBy::LongestFragment) => {
            pairs.sort_by_key(|p| Reverse(p.metrics.longest_fragment));
        }
        None => {}
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::collections::pair_array::PairArray;
    use crate::config::{FragmentSortBy, PairSortBy};
    use crate::file::File;
    use crate::metadata::Metadata;
    use crate::suffixtree::types::{AnalysisResult, Match, PairMetrics};
    use crate::winnowing::region::{Point, Region};
    use chrono::Utc;
    use std::path::PathBuf;
    use std::rc::Rc;
    use tree_sitter_grammars::Language;

    fn make_metadata(
        sort_by: Option<PairSortBy>,
        fragment_sort_by: Option<FragmentSortBy>,
    ) -> Metadata {
        Metadata {
            report_name: "test".to_string(),
            created_at: Utc::now(),
            sort_by,
            fragment_sort_by,
            kgram_length: 23,
            kgrams_in_window: 17,
            language: Language::Javascript,
            language_detected: true,
            include_comments: false,
            include_fragments: true,
            min_length_match: 1,
            max_fingerprint_file_count: None,
            ignore: None,
        }
    }

    fn make_report(
        analysis: AnalysisResult,
        files: Vec<Rc<File>>,
        locations: Option<Vec<Vec<Region>>>,
        sort_by: Option<PairSortBy>,
        fragment_sort_by: Option<FragmentSortBy>,
    ) -> Report {
        Report::new(
            analysis,
            files,
            locations,
            make_metadata(sort_by, fragment_sort_by),
        )
    }

    fn make_file(id: usize, name: &str) -> Rc<File> {
        Rc::new(File {
            id,
            relative_path: PathBuf::from(name),
            content: "".to_string(),
        })
    }

    fn make_metrics(similarity: f64) -> PairMetrics {
        PairMetrics {
            similarity,
            total_left: 10,
            total_right: 10,
            overlap_left: (similarity * 10.0) as usize,
            overlap_right: (similarity * 10.0) as usize,
            longest_fragment: 3,
        }
    }

    /// `test_from` verifies that `Report::new` correctly stores metrics and
    /// that files are accessible on the resulting report.
    #[test]
    fn test_from() {
        let files = vec![
            make_file(0, "a.js"),
            make_file(1, "b.js"),
            make_file(2, "c.js"),
        ];
        let mut metrics = PairArray::new(3, PairMetrics::default());
        metrics.set(0, 1, make_metrics(0.5));
        metrics.set(0, 2, make_metrics(0.2));
        metrics.set(1, 2, make_metrics(0.8));

        let analysis = AnalysisResult { metrics, matches: None };
        let report = make_report(analysis, files.clone(), None, None, None);

        assert_eq!(report.pairs.len(), 3);

        // Find the (a.js, b.js) pair and check its metrics
        let ab = report
            .pairs
            .iter()
            .find(|p| {
                p.left_file.as_ref() == files[0].as_ref()
                    && p.right_file.as_ref() == files[1].as_ref()
            })
            .expect("a.js-b.js pair not found");

        assert_eq!(ab.metrics.similarity, 0.5);
        assert_eq!(ab.metrics.total_left, 10);
        assert_eq!(ab.metrics.total_right, 10);
        assert_eq!(ab.metrics.longest_fragment, 3);
        assert!(ab.fragments.is_none());
    }

    /// `test_resolve_fragments` verifies that raw `Match` objects are correctly
    /// converted into `Fragment`s with the right regions and fingerprint counts.
    #[test]
    fn test_resolve_fragments() {
        // Two locations per file (two fingerprints each)
        let locations = vec![
            vec![
                Region::new(Point::new(0, 0), Point::new(0, 5)),
                Region::new(Point::new(1, 0), Point::new(1, 5)),
            ],
            vec![
                Region::new(Point::new(10, 0), Point::new(10, 5)),
                Region::new(Point::new(11, 0), Point::new(11, 5)),
            ],
        ];

        let mut raw_matches: PairArray<Vec<Match>> = PairArray::new(2, Vec::new());
        raw_matches.set(
            0,
            1,
            vec![Match { left_start: 0, right_start: 0, length: 2, ignored: false }],
        );

        let fragments = Report::resolve_fragments(raw_matches, locations, &None);
        let frags = fragments.get(0, 1);

        assert_eq!(frags.len(), 1);
        let f = &frags[0];
        assert_eq!(f.fingerprint_count, 2);
        // Spans from start of first loc to end of last loc
        assert_eq!(f.left_region.start_point, Point::new(0, 0));
        assert_eq!(f.left_region.end_point, Point::new(1, 5));
        assert_eq!(f.right_region.start_point, Point::new(10, 0));
        assert_eq!(f.right_region.end_point, Point::new(11, 5));
    }

    /// `test_all_pairs` verifies that `pairs` returns exactly all
    /// unordered file pairs in the correct order and with correct file refs.
    #[test]
    fn test_all_pairs() {
        let files = vec![
            make_file(0, "x.js"),
            make_file(1, "y.js"),
            make_file(2, "z.js"),
        ];
        let metrics = PairArray::new(3, make_metrics(0.0));
        let analysis = AnalysisResult { metrics, matches: None };
        let report = make_report(analysis, files.clone(), None, None, None);

        assert_eq!(report.pairs.len(), 3);

        let pair_files: Vec<_> = report
            .pairs
            .iter()
            .map(|p| (p.left_file.as_ref(), p.right_file.as_ref()))
            .collect();
        assert!(pair_files.contains(&(files[0].as_ref(), files[1].as_ref())));
        assert!(pair_files.contains(&(files[0].as_ref(), files[2].as_ref())));
        assert!(pair_files.contains(&(files[1].as_ref(), files[2].as_ref())));
    }

    /// `test_sort_by_similarity` verifies that `sort_by: Similarity` yields pairs
    /// in descending similarity order.
    #[test]
    fn test_sort_by_similarity() {
        let files = vec![
            make_file(0, "a.js"),
            make_file(1, "b.js"),
            make_file(2, "c.js"),
        ];
        let mut metrics = PairArray::new(3, PairMetrics::default());
        metrics.set(0, 1, make_metrics(0.5));
        metrics.set(0, 2, make_metrics(0.2));
        metrics.set(1, 2, make_metrics(0.8));

        let analysis = AnalysisResult { metrics, matches: None };
        let report = make_report(analysis, files, None, Some(PairSortBy::Similarity), None);

        let similarities: Vec<f64> = report.pairs.iter().map(|p| p.metrics.similarity).collect();
        assert_eq!(similarities, vec![0.8, 0.5, 0.2]);
    }

    /// `test_fragment_sort_by_kgrams_descending` verifies that fragments are
    /// stored in descending fingerprint-count order when requested.
    #[test]
    fn test_fragment_sort_by_kgrams_descending() {
        // Three fingerprint locations per file
        let locations: Vec<Vec<Region>> = vec![
            (0..3)
                .map(|r| Region::new(Point::new(r, 0), Point::new(r, 5)))
                .collect(),
            (10..13)
                .map(|r| Region::new(Point::new(r, 0), Point::new(r, 5)))
                .collect(),
        ];
        // Two matches: one covering 1 fingerprint, one covering 2
        let mut raw_matches: PairArray<Vec<Match>> = PairArray::new(2, Vec::new());
        raw_matches.set(
            0,
            1,
            vec![
                Match { left_start: 0, right_start: 0, length: 1, ignored: false },
                Match { left_start: 1, right_start: 1, length: 2, ignored: false },
            ],
        );

        let analysis = AnalysisResult {
            metrics: PairArray::new(2, PairMetrics::default()),
            matches: Some(raw_matches),
        };
        let report = make_report(
            analysis,
            vec![make_file(0, "a.js"), make_file(1, "b.js")],
            Some(locations),
            None,
            Some(FragmentSortBy::KgramsDescending),
        );

        let pair = report.pairs.into_iter().next().unwrap();
        let counts: Vec<usize> = pair
            .fragments
            .unwrap()
            .iter()
            .map(|f| f.fingerprint_count)
            .collect();
        assert_eq!(counts, vec![2, 1]);
    }
}
