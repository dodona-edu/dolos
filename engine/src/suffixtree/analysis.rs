use std::collections::HashMap;
use crate::suffixtree::node::{Node, LetterType};
use crate::suffixtree::pair_array::PairArray;
use crate::suffixtree::pair_bitmap::PairBitmap;
use crate::suffixtree::tree::{Tree, SENTINEL_LETTER};

/// Represents a starting position of a match in the input sequences
#[derive(Debug, Clone)]
pub struct StartPosition {
    /// Index of the input sequence this position belongs to
    pub input: usize,
    /// Offset within the input sequence where the match starts
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
    /// The input sequences being compared
    inputs: &'a [Vec<LetterType>],
    /// Tracks the longest matching fragment length for each pair of inputs
    longest_fragments: PairArray<usize>,
    /// Bitmap tracking which positions have been covered by matches, per input pair
    overlap_bitmap: PairBitmap,
}

impl<'a> MatchCollector<'a> {
    /// Create a new `MatchCollector` for the given input sequences.
    ///
    /// Initialises the longest-fragment tracker and overlap bitmap with sizes
    /// derived from the lengths of each input sequence.
    fn new(inputs: &'a [Vec<usize>]) -> Self {
        let input_lengths:Vec<usize> = inputs.iter().map(|i| i.len()).collect();

        Self {
            inputs,
            longest_fragments: PairArray::new(inputs.len(), 0),
            overlap_bitmap: PairBitmap::new(input_lengths.as_slice()),
        }
    }

    /// Record a maximal match between two positions.
    ///
    /// Computes the effective match length (trimming end-of-sequence markers),
    /// updates the longest-fragment tracker, and marks the covered positions in
    /// the overlap bitmap so that overlapping matches are not double-counted.
    fn record_match(&mut self, sp1: &StartPosition, sp2: &StartPosition, length: usize) {
        let effective_length = self.calculate_effective_length(sp1, sp2, length);

        if effective_length == 0 {
            return;
        }

        self.update_longest_fragment(sp1.input, sp2.input, effective_length);
        self.overlap_bitmap.mark_pair(sp1.input, sp2.input, sp1.start, sp2.start, effective_length);
    }

    /// Calculate the effective length of a match, excluding end markers.
    ///
    /// If the match reaches the end-of-sequence sentinel (`$`) of either input,
    /// the length is reduced by one so the sentinel is not counted as shared content.
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

    /// Update the longest fragment for a pair if the new length exceeds the current maximum.
    fn update_longest_fragment(&mut self, input1: usize, input2: usize, length: usize) {
        let current = self.longest_fragments.get_mut(input1, input2);
        if length > *current {
            *current = length;
        }
    }

    /// Consume the collector and build the final [`AnalysisResult`].
    ///
    /// Computes pairwise similarity scores from the overlap bitmap and packages
    /// them together with the longest-fragment data.
    fn into_result(self) -> AnalysisResult {
        let num_inputs = self.longest_fragments.size();
        let similarities = self.calculate_similarities(num_inputs);

        AnalysisResult {
            similarities,
            longest_fragments: self.longest_fragments,
        }
    }

    /// Calculate pairwise similarity scores for all input pairs.
    ///
    /// For each pair `(i1, i2)` the similarity is defined as:
    ///
    /// ```text
    /// similarity = total_overlap / (len(i1) - 1 + len(i2) - 1)
    /// ```
    ///
    /// where `total_overlap` is the number of positions covered by at least one
    /// shared match (as tracked by the overlap bitmap), and the `-1` on each
    /// length accounts for the mandatory end-of-sequence sentinel (`$`).
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

/// Analyzer for finding maximal exact matches in a generalised suffix tree.
///
/// A *maximal exact match* (MEM) between two sequences is a shared substring
/// that cannot be extended in either direction without introducing a mismatch.
/// This analyzer traverses the suffix tree bottom-up, collecting left-extension
/// characters at each internal node to identify MEMs and report pairwise
/// similarity statistics.
pub struct MaximalMatchAnalyzer<'a> {
    /// The generalised suffix tree built from all input sequences
    tree: &'a Tree,
    /// The original input sequences (including their end-of-sequence sentinels)
    inputs: &'a [Vec<LetterType>],
    /// Only matches of at least this many tokens are considered
    min_match_length: usize,
}

impl<'a> MaximalMatchAnalyzer<'a> {
    /// Create a new [`MaximalMatchAnalyzer`].
    ///
    /// # Arguments
    /// * `tree` – Generalised suffix tree built from all `inputs`.
    /// * `inputs` – The original token sequences, each terminated with a unique
    ///   end-of-sequence sentinel.
    /// * `min_match_length` – Minimum number of tokens a shared substring must
    ///   have to be counted as a match.
    pub fn new(tree: &'a Tree, inputs: &'a [Vec<LetterType>], min_match_length: usize) -> Self {
        Self {
            tree,
            inputs,
            min_match_length,
        }
    }

    /// Perform the full MEM analysis and return pairwise similarity results.
    ///
    /// Traverses the suffix tree depth-first, identifies all maximal exact
    /// matches that meet `min_match_length`, and aggregates them into an
    /// [`AnalysisResult`] containing per-pair similarity scores and longest
    /// fragment lengths.
    pub fn analyze(&self) -> AnalysisResult {
        let mut collector = MatchCollector::new(self.inputs);

        // Find all maximal pairs starting from the root
        self.find_maximal_pairs(0, 0, &mut collector);

        collector.into_result()
    }

    /// Build the left-character maps for a leaf node.
    ///
    /// Each leaf represents a suffix from one or more input sequences.  For every
    /// input stored at this leaf the method computes the start index of the
    /// suffix (given the current string `depth`) and records the character
    /// immediately to the *left* of that suffix (i.e. the character that would
    /// need to match for the current shared substring to be extended leftward).
    /// [`usize::MAX`] is used as a sentinel when the suffix starts at position 0.
    ///
    /// Returns one `HashMap<left_char → positions>` per input stored at the leaf.
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

    /// Merge a list of `left_char → positions` maps into a single map.
    ///
    /// Maps from different children are combined so that positions sharing the
    /// same left character end up in the same bucket.
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

    /// Generate all maximal pairs from the children maps at a given depth.
    ///
    /// A match is a *maximal exact match* (MEM) when it cannot be extended in
    /// either direction without introducing a mismatch:
    ///
    /// - **Right maximality** is guaranteed by the tree structure itself:
    ///   positions coming from *different* child maps diverged at the current
    ///   internal node, meaning they were reached via different edge characters.
    ///   The character immediately after the shared prefix therefore already
    ///   differs between the two groups — no explicit check is needed.
    ///
    /// - **Left maximality** is checked explicitly by comparing the `left_char`
    ///   of each position (the character immediately before the match).  Two
    ///   groups are left-maximal with respect to each other when their
    ///   `left_char` values differ, or when one group is at the very start of
    ///   its sequence (sentinel [`usize::MAX`]).
    ///
    /// All position pairs that satisfy both conditions are forwarded to
    /// [`Self::process_position_pairs`] for recording.
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

    /// Compare `positions1` against every bucket in the subsequent children maps.
    ///
    /// For each `(other_left_char, positions2)` bucket in `subsequent_maps`, the
    /// pair is eligible for recording only when [`Self::should_process_pair`]
    /// returns `true` (i.e. the left characters differ, indicating maximality).
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

    /// Returns `true` when the two left characters indicate that this pair
    /// should be recorded.
    ///
    /// Two conditions trigger a `true`:
    /// - The characters differ.
    /// - Either character is [`usize::MAX`], the start-of-sequence sentinel
    ///   used when a suffix begins at position 0 and has no left neighbour.
    ///   Because no real character can equal [`usize::MAX`], this sentinel is
    ///   always treated as distinct from any other value, including another
    ///   sentinel (two suffixes both starting at position 0 in different inputs
    ///   should still be paired).
    #[inline]
    fn should_process_pair(&self, left_char: LetterType, other_left_char: LetterType) -> bool {
        // Process pairs where left characters differ, or where left_char is STRING_SENTINEL (start of string)
        other_left_char != left_char || left_char == SENTINEL_LETTER
    }

    /// Record a match for every cross-input pair between `positions1` and `positions2`.
    ///
    /// Positions that belong to the *same* input are skipped — a suffix can only
    /// form a meaningful plagiarism signal when it appears in two *different*
    /// source files.  For each valid cross-input pair the current string `depth`
    /// is used as the match length.
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

    /// Recursively find all MEMs in the subtree rooted at `node_index`,
    /// returning the merged left-character map for this subtree.
    ///
    /// The core idea is a **bottom-up traversal**: every internal node in the
    /// suffix tree represents a substring shared by all suffixes in its subtree.
    /// By the time we return from a node's children, we know — for each suffix
    /// in the subtree — what character appears immediately to the *left* of that
    /// shared substring (the `left_char`).  We collect these into per-child
    /// `left_char → positions` maps (see [`Self::create_leaf_maps`] for leaves,
    /// [`Self::collect_children_maps`] for internal nodes).
    ///
    /// At each internal node we then compare the maps of every pair of children
    /// (see [`Self::generate_pairs`]).  Because the children diverged at this
    /// node, their suffixes already differ on the *right* — so right-maximality
    /// is free.  Left-maximality is checked by comparing `left_char` values:
    /// two occurrences form a MEM only when their left characters differ
    /// (or one is at the start of its sequence).
    ///
    /// Finally, the children's maps are merged and propagated upward, so that
    /// the parent node can repeat the same comparison at a greater depth.
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

    /// Recursively process all children of `node` and collect their left-character maps.
    ///
    /// Each child's subtree is visited via [`Self::find_maximal_pairs`], which
    /// both records any MEMs found below in the [`MatchCollector`] and returns
    /// the merged left-character map for that child.
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
