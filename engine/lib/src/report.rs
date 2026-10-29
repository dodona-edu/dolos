use crate::config::PairSortBy;
use crate::file::File;
use crate::fragment::Fragment;
use crate::metadata::Metadata;
use dolos_core::{PairArray, PairMetrics};
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
    /// Build a report from the pair metrics and the resolved fragments.
    pub(crate) fn new(
        metrics: &PairArray<PairMetrics>,
        fragments: Option<PairArray<Vec<Fragment>>>,
        files: Vec<Rc<File>>,
        metadata: Metadata,
    ) -> Report {
        let mut fragments = fragments.map(PairArray::into_iter_pairs);
        let mut pairs: Vec<Pair> = metrics
            .iter_pairs()
            .map(|(left, right, metrics)| Pair {
                left_file: files[left].clone(),
                right_file: files[right].clone(),
                metrics: metrics.clone(),
                fragments: fragments.as_mut().and_then(Iterator::next).map(
                    |(fragment_left, fragment_right, pair_fragments)| {
                        debug_assert_eq!((fragment_left, fragment_right), (left, right));
                        pair_fragments
                    },
                ),
            })
            .collect();

        sort_pairs(&mut pairs, &metadata.sort_by);

        Report { metadata, files, pairs }
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
            pairs.sort_by_key(|p| Reverse(p.metrics.longest_match));
        }
        None => {}
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::PairSortBy;
    use crate::file::File;
    use crate::metadata::Metadata;
    use chrono::Utc;
    use dolos_core::{AnalysisOptions, AnalysisResult};
    use std::path::PathBuf;
    use std::rc::Rc;
    use tree_sitter_grammars::Language;

    fn make_metadata(sort_by: Option<PairSortBy>) -> Metadata {
        Metadata {
            report_name: "test".to_string(),
            created_at: Utc::now(),
            sort_by,
            fragment_sort_by: None,
            kgram_length: 23,
            kgrams_in_window: 17,
            language: Language::Javascript,
            include_comments: false,
            include_fragments: true,
            include_analysis_data: false,
            min_length_match: 1,
            max_fingerprint_file_count: None,
            ignore: None,
        }
    }

    fn make_file(id: usize, name: &str) -> Rc<File> {
        Rc::new(File {
            id,
            relative_path: PathBuf::from(name),
            content: String::new(),
            analysis_data: None,
        })
    }

    /// The analysis of three sequences. Pair (0, 1) shares three symbols,
    /// pair (1, 2) two and pair (0, 2) one.
    fn analyze_three() -> AnalysisResult {
        let sequences = vec![vec![1, 2, 3, 4], vec![1, 2, 3, 5], vec![6, 2, 7, 5]];
        let options = AnalysisOptions { min_match_length: 1, keep_matches: false };
        dolos_core::analyze(&sequences, None, &options).unwrap()
    }

    /// Three files give three pairs, each carrying the metrics of its own pair
    /// and references to the right two files.
    #[test]
    fn every_pair_gets_its_own_metrics() {
        let files = vec![
            make_file(0, "a.js"),
            make_file(1, "b.js"),
            make_file(2, "c.js"),
        ];
        let result = analyze_three();

        let report = Report::new(result.metrics(), None, files.clone(), make_metadata(None));

        assert_eq!(report.pairs.len(), 3);
        let pair_files: Vec<_> = report
            .pairs
            .iter()
            .map(|p| (p.left_file.as_ref(), p.right_file.as_ref()))
            .collect();
        assert!(pair_files.contains(&(files[0].as_ref(), files[1].as_ref())));
        assert!(pair_files.contains(&(files[0].as_ref(), files[2].as_ref())));
        assert!(pair_files.contains(&(files[1].as_ref(), files[2].as_ref())));

        let ab = report
            .pairs
            .iter()
            .find(|p| {
                p.left_file.as_ref() == files[0].as_ref()
                    && p.right_file.as_ref() == files[1].as_ref()
            })
            .expect("a.js-b.js pair not found");
        assert_eq!(Some(&ab.metrics), result.metrics().get(0, 1));
        assert_eq!(ab.metrics.longest_match, 3);
        assert!(ab.fragments.is_none());
    }

    /// `sort_by: Similarity` orders the pairs by descending similarity.
    #[test]
    fn pairs_are_sorted_by_similarity() {
        let files = vec![
            make_file(0, "a.js"),
            make_file(1, "b.js"),
            make_file(2, "c.js"),
        ];
        let result = analyze_three();

        let report = Report::new(
            result.metrics(),
            None,
            files,
            make_metadata(Some(PairSortBy::Similarity)),
        );

        let similarities: Vec<f64> = report.pairs.iter().map(|p| p.metrics.similarity).collect();
        assert_eq!(similarities, vec![0.75, 0.5, 0.25]);
    }
}
