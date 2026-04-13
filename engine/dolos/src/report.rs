use crate::collections::pair_array::PairArray;
use crate::file::File;
use std::rc::Rc;

/// Result of the analysis containing similarity metrics for all input pairs
#[derive(Debug)]
pub struct AnalysisResult {
    /// Similarity scores between pairs of inputs (indexed as [i1][i2] where i1 < i2)
    pub similarities: PairArray<f64>,
    /// Length of the longest common substring between pairs
    pub longest_fragments: PairArray<usize>,
}

/// A single file-pair result, ready for display or output.
pub struct Pair<'a> {
    pub left_file: &'a File,
    pub right_file: &'a File,
    pub similarity: f64,
    pub longest_fragment: usize,
}

pub struct Report {
    analysis_result: AnalysisResult,
    files: Vec<Rc<File>>,
}

impl Report {
    pub(crate) fn from(analysis_result: AnalysisResult, files: Vec<Rc<File>>) -> Report {
        Report {
            analysis_result,
            files,
        }
    }

    /// Iterates over every unordered pair of files, yielding a [`Pair`] with
    /// precomputed similarity and longest-fragment metrics.
    pub fn iter_pairs(&self) -> impl Iterator<Item = Pair<'_>> {
        let files = self.files.as_slice();
        let longest_fragments = &self.analysis_result.longest_fragments;
        self.analysis_result
            .similarities
            .iter_pairs()
            .map(move |(left, right, similarity)| Pair {
                left_file: &files[left],
                right_file: &files[right],
                similarity: *similarity,
                longest_fragment: *longest_fragments.get(left, right),
            })
    }

    /// Returns the similarity score between the two files at the given indices.
    pub fn similarity(&self, left: usize, right: usize) -> f64 {
        *self.analysis_result.similarities.get(left, right)
    }
}
