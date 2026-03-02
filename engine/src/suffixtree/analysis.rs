use std::collections::HashMap;
use crate::suffixtree::node::{Node, LetterType};
use crate::suffixtree::pair_array::PairArray;
use crate::suffixtree::pair_bitmap::PairBitmap;
use crate::suffixtree::tree::{Tree, SENTINEL_LETTER};

/// Represents a starting position of a match in the input sequences
#[derive(Debug, Clone)]
pub struct StartPosition {
    pub input: usize,
    pub start: usize,
}

/// Result of the analysis containing similarity metrics for all input pairs
#[derive(Debug)]
pub struct AnalysisResult {
    /// Similarity scores between pairs of inputs (indexed as [i1][i2] where i1 < i2)
    pub similarities: PairArray<f64>,
    /// Length of the longest common substring between pairs
    pub longest_fragments: PairArray<usize>,
}

/// Collects and processes matches found during tree traversal
struct MatchCollector<'a> {
    inputs: &'a [Vec<LetterType>],
    longest_fragments: PairArray<usize>,
    overlap_bitmap: PairBitmap,
}

impl<'a> MatchCollector<'a> {
    fn new(inputs: &'a [Vec<usize>]) -> Self {
        let input_lengths:Vec<usize> = inputs.iter().map(|i| i.len()).collect();

        Self {
            inputs,
            longest_fragments: PairArray::new(inputs.len(), 0),
            overlap_bitmap: PairBitmap::new(input_lengths.as_slice()),
        }
    }

    /// Record a maximal match between two positions
    fn record_match(&mut self, sp1: &StartPosition, sp2: &StartPosition, length: usize) {
        let effective_length = self.calculate_effective_length(sp1, sp2, length);

        if effective_length == 0 {
            return;
        }

        self.update_longest_fragment(sp1.input, sp2.input, effective_length);
        self.overlap_bitmap.mark_pair(sp1.input, sp2.input, sp1.start, sp2.start, effective_length);
    }

    /// Calculate the effective length of a match, excluding end markers
    #[inline]
    fn calculate_effective_length(&self, sp1: &StartPosition, sp2: &StartPosition, length: usize) -> usize {
        let ends_at_marker = sp1.start + length >= self.inputs[sp1.input].len()
            || sp2.start + length >= self.inputs[sp2.input].len();

        if ends_at_marker {
            length.saturating_sub(1)
        } else {
            length
        }
    }

    /// Update the longest fragment for a pair if this is longer
    fn update_longest_fragment(&mut self, input1: usize, input2: usize, length: usize) {
        let current = self.longest_fragments.get_mut(input1, input2);
        if length > *current {
            *current = length;
        }
    }

    /// Build the final analysis result
    fn into_result(self) -> AnalysisResult {
        let num_inputs = self.longest_fragments.size();
        let similarities = self.calculate_similarities(num_inputs);

        AnalysisResult {
            similarities,
            longest_fragments: self.longest_fragments,
        }
    }

    /// Calculate similarities for all pairs
    fn calculate_similarities(&self, num_inputs: usize) -> PairArray<f64> {
        let mut similarities = PairArray::new(num_inputs, 0.0);

        for i1 in 0..num_inputs {
            for i2 in (i1 + 1)..num_inputs {
                let total_overlap = self.overlap_bitmap.count_ones_pair(i1, i2);
                // Subtract 1 from each length to account for the end marker ($)
                let total_length = (self.inputs[i1].len() - 1)
                    + (self.inputs[i2].len() - 1);

                let similarity = if total_length == 0 {
                    0.0
                } else {
                    total_overlap as f64 / total_length as f64
                };
                similarities.set(i1, i2, similarity);
            }
        }

        similarities
    }
}

/// Analyzer for finding maximal exact matches in a suffix tree
pub struct MaximalMatchAnalyzer<'a> {
    tree: &'a Tree,
    inputs: &'a [Vec<LetterType>],
    min_match_length: usize,
}

impl<'a> MaximalMatchAnalyzer<'a> {
    /// Create a new analyzer
    pub fn new(tree: &'a Tree, inputs: &'a [Vec<LetterType>], min_match_length: usize) -> Self {
        Self {
            tree,
            inputs,
            min_match_length,
        }
    }

    /// Perform the analysis and return the results
    pub fn analyze(&self) -> AnalysisResult {
        let mut collector = MatchCollector::new(self.inputs);

        // Find all maximal pairs starting from the root
        self.find_maximal_pairs(0, 0, &mut collector);

        collector.into_result()
    }

    /// Create leaf maps for a leaf node
    /// Returns a map from left character to list of start positions
    /// `depth` is the string depth at this leaf (sum of all edge lengths from root to here)
    fn create_leaf_maps(&self, node: &Node, depth: usize) -> Vec<HashMap<LetterType, Vec<StartPosition>>> {
        node.inputs.as_ref().expect("Leaf node must have inputs")
            .iter()
            .map(|&input| {
                let seq_len = self.inputs[input].len();
                // depth equals the suffix length, so start = seq_len - depth
                let start_index = seq_len - depth;

                // Get the character to the left of this match, or STRING_SENTINEL if at the beginning
                let left_char = if start_index > 0 {
                    self.inputs[input][start_index - 1]
                } else {
                    SENTINEL_LETTER
                };

                let mut map = HashMap::new();
                map.insert(left_char, vec![StartPosition { start: start_index, input }]);
                map
            })
            .collect()
    }

    /// Merge a list of maps into a single map
    fn merge_maps(maps: Vec<HashMap<LetterType, Vec<StartPosition>>>) -> HashMap<LetterType, Vec<StartPosition>> {
        let mut result = HashMap::new();

        for map in maps {
            for (key, positions) in map {
                result
                    .entry(key)
                    .or_insert_with(Vec::new)
                    .extend(positions);
            }
        }

        result
    }

    /// Generate all maximal pairs from the children maps at a given depth
    fn generate_pairs(
        &self,
        depth: usize,
        children_maps: &[HashMap<LetterType, Vec<StartPosition>>],
        collector: &mut MatchCollector,
    ) {
        for (i, map) in children_maps.iter().enumerate() {
            for (&left_char, positions1) in map {
                self.process_pairs_with_subsequent_maps(
                    &children_maps[(i + 1)..],
                    left_char,
                    positions1,
                    depth,
                    collector,
                );
            }
        }
    }

    /// Process pairs between positions1 and all positions in subsequent maps
    fn process_pairs_with_subsequent_maps(
        &self,
        subsequent_maps: &[HashMap<LetterType, Vec<StartPosition>>],
        left_char: LetterType,
        positions1: &[StartPosition],
        depth: usize,
        collector: &mut MatchCollector,
    ) {
        for other_map in subsequent_maps {
            for (&other_left_char, positions2) in other_map {
                if self.should_process_pair(left_char, other_left_char) {
                    self.process_position_pairs(positions1, positions2, depth, collector);
                }
            }
        }
    }

    /// Check if two position groups should be paired based on their left characters
    #[inline]
    fn should_process_pair(&self, left_char: LetterType, other_left_char: LetterType) -> bool {
        // Process pairs where left characters differ, or where left_char is STRING_SENTINEL (start of string)
        other_left_char != left_char || left_char == SENTINEL_LETTER
    }

    /// Process all pairs between two position groups
    fn process_position_pairs(
        &self,
        positions1: &[StartPosition],
        positions2: &[StartPosition],
        depth: usize,
        collector: &mut MatchCollector,
    ) {
        for sp1 in positions1 {
            for sp2 in positions2 {
                if sp1.input != sp2.input {
                    collector.record_match(sp1, sp2, depth);
                }
            }
        }
    }

    /// Recursively find maximal pairs in the subtree rooted at the given node
    /// `depth` is the string depth at this node (sum of edge lengths from root to this node)
    fn find_maximal_pairs(
        &self,
        node_index: usize,
        depth: usize,
        collector: &mut MatchCollector,
    ) -> HashMap<LetterType, Vec<StartPosition>> {
        let node = &self.tree.arena[node_index];
        let node_depth = depth + node.range.length();

        let maps = if node.children.is_none() {
            self.create_leaf_maps(node, node_depth)
        } else {
            self.collect_children_maps(node, node_depth, collector)
        };

        // Generate pairs if we're at sufficient depth
        if node_depth >= self.min_match_length {
            self.generate_pairs(node_depth, &maps, collector);
        }

        // Merge all maps for the parent
        Self::merge_maps(maps)
    }

    /// Collect maps from all children by recursively processing them
    fn collect_children_maps(
        &self,
        node: &Node,
        node_depth: usize,
        collector: &mut MatchCollector,
    ) -> Vec<HashMap<LetterType, Vec<StartPosition>>> {
        node.children.as_ref().expect("Node must have children")
            .values()
            .map(|&child_index| self.find_maximal_pairs(child_index, node_depth, collector))
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::suffixtree::tree::Tree;
    use crate::suffixtree::tree_builder::{TreeBuilder, UkkonenBuilder};

    pub fn str_to_nodes(s: &str) -> Vec<LetterType> {
        s.as_bytes().iter().map(|&b| b as LetterType).collect()
    }

    #[test]
    fn test_identical_inputs() {
        let input = vec![
            str_to_nodes("ABC$"),
            str_to_nodes("ABC$")
        ];

        let mut tree = Tree::new();
        tree.add_words(&input, UkkonenBuilder::new());
        let analyzer = MaximalMatchAnalyzer::new(&tree, &input, 1);
        let result = analyzer.analyze();

        // Both inputs are identical, so similarity should be 1.0
        assert_eq!(*result.similarities.get(0, 1), 1.0);
        assert_eq!(*result.longest_fragments.get(0, 1), 3); // "ABC" without the $
    }

    #[test]
    fn test_non_overlapping_inputs() {
        let input = vec![
            str_to_nodes("ABC$"),
            str_to_nodes("DEF$")
        ];

        let mut tree = Tree::new();
        tree.add_words(&input, UkkonenBuilder::new());
        let analyzer = MaximalMatchAnalyzer::new(&tree, &input, 1);
        let result = analyzer.analyze();

        // No overlap
        assert_eq!(*result.similarities.get(0, 1), 0.0);
        assert_eq!(*result.longest_fragments.get(0, 1), 0);
    }

    #[test]
    fn test_partial_overlap() {
        let input = vec![
            str_to_nodes("ABCDEF$"),
            str_to_nodes("XYZABC$")
        ];

        let mut tree = Tree::new();
        tree.add_words(&input, UkkonenBuilder::new());
        let analyzer = MaximalMatchAnalyzer::new(&tree, &input, 1);
        let result = analyzer.analyze();

        // "ABC" is shared
        assert_eq!(*result.longest_fragments.get(0, 1), 3);
        assert_eq!(*result.similarities.get(0, 1), 0.5);
    }

    #[test]
    fn test_multiple_inputs() {
        let input = vec![
            str_to_nodes("ABCD$"),
            str_to_nodes("ABCE$"),
            str_to_nodes("XYZW$")
        ];

        let mut tree = Tree::new();
        tree.add_words(&input, UkkonenBuilder::new());
        let analyzer = MaximalMatchAnalyzer::new(&tree, &input, 1);
        let result = analyzer.analyze();

        // Input 0 and 1 share "ABC"
        assert_eq!(*result.longest_fragments.get(0, 1), 3);
        assert_eq!(*result.similarities.get(0, 1), 0.75);
        // Input 0 and 2 share nothing
        assert_eq!(*result.longest_fragments.get(0, 2), 0);
        assert_eq!(*result.similarities.get(0, 2), 0.0);
        // Input 1 and 2 share nothing
        assert_eq!(*result.longest_fragments.get(1, 2), 0);
        assert_eq!(*result.similarities.get(1, 2), 0.0);
    }

    #[test]
    fn test_min_match_length() {
        let input = vec![
            str_to_nodes("ABCDEF$"),
            str_to_nodes("XYZABC$")
        ];

        let mut tree = Tree::new();
        tree.add_words(&input, UkkonenBuilder::new());
        // With min_match_length = 5, "ABC" (length 3) should not be counted
        let analyzer = MaximalMatchAnalyzer::new(&tree, &input, 5);
        let result = analyzer.analyze();

        assert_eq!(*result.longest_fragments.get(0, 1), 0);
    }
}
