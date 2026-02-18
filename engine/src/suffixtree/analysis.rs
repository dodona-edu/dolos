use std::collections::HashMap;
use bitvec::prelude::*;
use crate::suffixtree::node::{Node, NodeType};
use crate::suffixtree::pair_array::PairArray;
use crate::suffixtree::tree::Tree;

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

/// Overlap tracking for similarity calculation using bit vectors
struct OverlapBitsets<'a> {
    /// For each pair (i, j), stores two vectors tracking which positions are covered
    data: PairArray<(BitVec, BitVec)>,
    input_lengths: &'a Vec<usize>,
}

impl<'a> OverlapBitsets<'a> {
    fn new(input_lengths: &'a Vec<usize>) -> Self {
        let size = input_lengths.len();
        let pair_count = size * (size - 1) / 2;

        // Pre-allocate with properly sized BitVecs
        let mut temp_data = Vec::with_capacity(pair_count);
        for i in 0..size {
            for j in (i + 1)..size {
                temp_data.push((
                    bitvec![0; input_lengths[i]],
                    bitvec![0; input_lengths[j]]
                ));
            }
        }

        let data = PairArray::from_vec(temp_data, size);

        Self { data, input_lengths }
    }

    /// Mark a range in the overlap bitsets for a pair of inputs
    /// Excludes the last position (the end marker $) from being marked
    fn mark_overlap(&mut self, sp1: &StartPosition, sp2: &StartPosition, length: usize) {
        if sp1.input == sp2.input {
            return;
        }

        let (bits1, bits2) = self.data.get_mut(sp1.input, sp2.input);

        // Determine which bitset corresponds to which start position
        let (start1, start2) = if sp1.input < sp2.input {
            (sp1.start, sp2.start)
        } else {
            (sp2.start, sp1.start)
        };

        // Mark the range for the first and second position (excluding the last position which is $)
        let end1 = start1 + length;
        let end2 = start2 + length;
        bits1[start1..end1].fill(true);
        bits2[start2..end2].fill(true);
    }

    /// Calculate similarity for a pair of inputs
    ///
    /// Similarity is defined as the total overlap divided by the total length
    /// (excluding end markers)
    fn calculate_similarity(&self, i1: usize, i2: usize) -> f64 {
        let (bits1, bits2) = self.data.get(i1, i2);
        let total_overlap = bits1.count_ones() + bits2.count_ones();

        // Subtract 1 from each length to account for the end marker ($)
        let total_length = (self.input_lengths[i1] - 1) + (self.input_lengths[i2] - 1);

        if total_length == 0 {
            0.0
        } else {
            total_overlap as f64 / total_length as f64
        }
    }
}

/// Analyzer for finding maximal exact matches in a suffix tree
pub struct MaximalMatchAnalyzer<'a> {
    tree: &'a Tree,
    inputs: &'a [&'a [NodeType]],
    min_match_length: usize,
}

impl<'a> MaximalMatchAnalyzer<'a> {
    /// Create a new analyzer
    pub fn new(tree: &'a Tree, inputs: &'a [&'a [NodeType]], min_match_length: usize) -> Self {
        Self {
            tree,
            inputs,
            min_match_length,
        }
    }

    /// Perform the analysis and return the results
    pub fn analyze(&self) -> AnalysisResult {
        let input_lengths: Vec<usize> = self.inputs.iter().map(|i| i.len()).collect();
        let num_inputs = self.inputs.len();

        let mut longest_fragments = PairArray::new(num_inputs, 0);
        let mut overlap_bitsets = OverlapBitsets::new(&input_lengths);

        // Process callback for each maximal pair found
        let mut process = |sp1: &StartPosition, sp2: &StartPosition, length: usize| {
            // Calculate the effective length excluding the end marker
            let effective_length = self.calculate_effective_length(sp1, sp2, length);

            if effective_length == 0 {
                return;
            }

            // Update longest fragment if this is longer
            let current = longest_fragments.get_mut(sp1.input, sp2.input);
            if effective_length > *current {
                *current = effective_length;
            }

            // Mark overlap
            overlap_bitsets.mark_overlap(sp1, sp2, effective_length);
        };

        // Find all maximal pairs starting from the root
        self.find_maximal_pairs(0, 0, &mut process);

        // Calculate similarities
        let similarities = self.calculate_all_similarities(&overlap_bitsets, num_inputs);

        AnalysisResult {
            similarities,
            longest_fragments,
        }
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

    /// Calculate similarities for all pairs
    fn calculate_all_similarities(&self, overlap_bitsets: &OverlapBitsets, num_inputs: usize) -> PairArray<f64> {
        let mut similarities = PairArray::new(num_inputs, 0.0);

        for i1 in 0..num_inputs {
            for i2 in (i1 + 1)..num_inputs {
                let similarity = overlap_bitsets.calculate_similarity(i1, i2);
                similarities.set(i1, i2, similarity);
            }
        }

        similarities
    }

    /// Create leaf maps for a leaf node
    /// Returns a map from left character to list of start positions
    /// `depth` is the string depth at this leaf (sum of all edge lengths from root to here)
    fn create_leaf_maps(&self, node: &Node, depth: usize) -> Vec<HashMap<NodeType, Vec<StartPosition>>> {
        node.inputs
            .iter()
            .map(|&input| {
                let seq_len = self.inputs[input].len();
                // depth equals the suffix length, so start = seq_len - depth
                let start_index = seq_len - depth;

                // Get the character to the left of this match, or 0 if at the beginning
                let left_char = if start_index > 0 {
                    self.inputs[input][start_index - 1]
                } else {
                    0
                };

                let mut map = HashMap::new();
                map.insert(left_char, vec![StartPosition { start: start_index, input }]);
                map
            })
            .collect()
    }

    /// Get union of all values from maps where the key is different from the given key
    /// (or where the key is 0, meaning start of string)
    fn union_values(&self, maps: &[HashMap<NodeType, Vec<StartPosition>>], exclude_key: NodeType) -> Vec<StartPosition> {
        maps.iter()
            .flat_map(|map| {
                map.iter()
                    .filter(|(&k, _)| k != exclude_key || k == 0)
                    .flat_map(|(_, positions)| positions.iter().cloned())
            })
            .collect()
    }

    /// Process all pairs of positions with the given length
    #[inline]
    fn process_pairs<F>(
        &self,
        length: usize,
        positions1: &[StartPosition],
        positions2: &[StartPosition],
        process: &mut F,
    ) where
        F: FnMut(&StartPosition, &StartPosition, usize),
    {
        for sp1 in positions1 {
            for sp2 in positions2 {
                if sp1.input != sp2.input {
                    process(sp1, sp2, length);
                }
            }
        }
    }

    /// Generate all maximal pairs from the children maps at a given depth
    fn generate_pairs<F>(
        &self,
        depth: usize,
        children_maps: &[HashMap<NodeType, Vec<StartPosition>>],
        process: &mut F,
    ) where
        F: FnMut(&StartPosition, &StartPosition, usize),
    {
        for (i, map) in children_maps.iter().enumerate() {
            for (&left_char, positions) in map {
                // Get union of positions from subsequent maps with different left character
                let union = self.union_values(&children_maps[(i + 1)..], left_char);
                self.process_pairs(depth, positions, &union, process);
            }
        }
    }

    /// Recursively find maximal pairs in the subtree rooted at the given node
    /// `depth` is the string depth at this node (sum of edge lengths from root to this node)
    fn find_maximal_pairs<F>(
        &self,
        node_index: usize,
        depth: usize,
        process: &mut F,
    ) -> HashMap<NodeType, Vec<StartPosition>>
    where
        F: FnMut(&StartPosition, &StartPosition, usize),
    {
        let node = &self.tree.arena[node_index];
        let node_depth = depth + node.range.length();

        let maps = if node.children.is_empty() {
            // Leaf node - use node_depth which includes this edge
            self.create_leaf_maps(node, node_depth)
        } else {
            // Internal node: recursively process children
            node.children
                .values()
                .map(|&child_index| {
                    self.find_maximal_pairs(child_index, node_depth, process)
                })
                .collect()
        };

        // Generate pairs if we're at sufficient depth (use node_depth, the depth at this node)
        if node_depth >= self.min_match_length {
            self.generate_pairs(node_depth, &maps, process);
        }

        // Merge all maps for the parent
        Self::merge_maps(maps)
    }

    /// Merge a list of maps into a single map
    fn merge_maps(maps: Vec<HashMap<NodeType, Vec<StartPosition>>>) -> HashMap<NodeType, Vec<StartPosition>> {
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
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::suffixtree::tree::Tree;
    use crate::suffixtree::tree_builder::{TreeBuilder, UkkonenBuilder};

    #[test]
    fn test_identical_inputs() {
        let vec1 = "ABC$".as_bytes();
        let vec2 = "ABC$".as_bytes();
        let inputs = vec![vec1, vec2];

        let tree = Tree::new(&inputs, UkkonenBuilder::new());
        let analyzer = MaximalMatchAnalyzer::new(&tree, &inputs, 1);
        let result = analyzer.analyze();

        // Both inputs are identical, so similarity should be 1.0
        assert!((result.similarities.get(0, 1) - 1.0).abs() < 0.001);
        assert_eq!(*result.longest_fragments.get(0, 1), 3); // "ABC" without the $
    }

    #[test]
    fn test_non_overlapping_inputs() {
        let vec1 = "ABC$".as_bytes();
        let vec2 = "DEF$".as_bytes();
        let inputs = vec![vec1, vec2];

        let tree = Tree::new(&inputs, UkkonenBuilder::new());
        let analyzer = MaximalMatchAnalyzer::new(&tree, &inputs, 1);
        let result = analyzer.analyze();

        // No overlap
        assert_eq!(*result.similarities.get(0, 1), 0.0);
        assert_eq!(*result.longest_fragments.get(0, 1), 0);
    }

    #[test]
    fn test_partial_overlap() {
        let vec1 = "ABCDEF$".as_bytes();
        let vec2 = "XYZABC$".as_bytes();
        let inputs = vec![vec1, vec2];

        let tree = Tree::new(&inputs, UkkonenBuilder::new());
        let analyzer = MaximalMatchAnalyzer::new(&tree, &inputs, 1);
        let result = analyzer.analyze();

        // "ABC" is shared
        assert_eq!(*result.longest_fragments.get(0, 1), 3);
        assert!(*result.similarities.get(0, 1) > 0.0);
    }

    #[test]
    fn test_multiple_inputs() {
        let vec1 = "ABCD$".as_bytes();
        let vec2 = "ABCE$".as_bytes();
        let vec3 = "XYZW$".as_bytes();
        let inputs = vec![vec1, vec2, vec3];

        let tree = Tree::new(&inputs, UkkonenBuilder::new());
        let analyzer = MaximalMatchAnalyzer::new(&tree, &inputs, 1);
        let result = analyzer.analyze();

        // Input 0 and 1 share "ABC"
        assert_eq!(*result.longest_fragments.get(0, 1), 3);
        // Input 0 and 2 share nothing
        assert_eq!(*result.longest_fragments.get(0, 2), 0);
        // Input 1 and 2 share nothing
        assert_eq!(*result.longest_fragments.get(1, 2), 0);
    }

    #[test]
    fn test_min_match_length() {
        let vec1 = "ABCDEF$".as_bytes();
        let vec2 = "XYZABC$".as_bytes();
        let inputs = vec![vec1, vec2];

        let tree = Tree::new(&inputs, UkkonenBuilder::new());

        // With min_match_length = 5, "ABC" (length 3) should not be counted
        let analyzer = MaximalMatchAnalyzer::new(&tree, &inputs, 5);
        let result = analyzer.analyze();

        assert_eq!(*result.longest_fragments.get(0, 1), 0);
    }
}
