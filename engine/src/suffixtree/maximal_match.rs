use crate::report::AnalysisResult;
use crate::suffixtree::match_collector::MatchCollector;
use crate::suffixtree::node::Node;
use crate::suffixtree::suffixtree::SuffixTree;
use crate::suffixtree::types::{SENTINEL_SYMBOL, SymbolType};
use std::collections::HashMap;

/// Represents a starting position of a match in the input sequences
#[derive(Debug, Clone)]
pub struct StartPosition {
    /// Index of the input sequence this position belongs to
    pub input: usize,
    /// Offset within the input sequence where the match starts
    pub start: usize,
}

/// Analyzer for finding maximal exact matches in a generalized suffix tree.
///
/// A *maximal exact match* (MEM) between two sequences is a shared substring
/// that cannot be extended in either direction without introducing a mismatch.
/// This analyzer traverses the suffix tree bottom-up, collecting left-extension
/// symbols at each internal node to identify MEMs and report pairwise
/// similarity statistics.
pub struct MaximalMatchAnalyzer<'a> {
    /// The generalized suffix tree built from all input sequences
    tree: &'a SuffixTree,
    /// The original input sequences (including their end-of-sequence sentinels)
    inputs: &'a [Vec<SymbolType>],
    /// Only matches of at least this many tokens are considered
    min_match_length: usize,
}

impl<'a> MaximalMatchAnalyzer<'a> {
    /// Create a new [`MaximalMatchAnalyzer`].
    ///
    /// # Arguments
    /// * `tree` – Generalized suffix tree built from all `inputs`.
    /// * `inputs` – The original token sequences, each terminated with a unique
    ///   end-of-sequence sentinel.
    /// * `min_match_length` – Minimum number of tokens a shared substring must
    ///   have to be counted as a match.
    pub fn new(
        tree: &'a SuffixTree,
        inputs: &'a [Vec<SymbolType>],
        min_match_length: usize,
    ) -> Self {
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

    /// Build the left-symbol maps for a leaf node.
    ///
    /// Each leaf represents a suffix from one or more input sequences. For every
    /// input stored at this leaf, the method computes the start index of the
    /// suffix (given the current string `depth`) and records the symbol
    /// immediately to the *left* of that suffix (i.e., the symbol that would
    /// need to match for the current shared substring to be extended leftward).
    /// [`usize::MAX`] is used as a sentinel when the suffix starts at position 0.
    ///
    /// Returns one `HashMap<left_symbol → positions>` per input stored at the leaf.
    fn create_leaf_maps(
        &self,
        node: &Node,
        depth: usize,
    ) -> Vec<HashMap<SymbolType, Vec<StartPosition>>> {
        node.inputs
            .as_ref()
            .expect("Leaf node must have inputs")
            .iter()
            .map(|&input| {
                let seq_len = self.inputs[input].len();
                // depth equals the suffix length, so start = seq_len - depth
                let start_index = seq_len - depth;

                // Get the symbol to the left of this match, or STRING_SENTINEL if at the beginning
                let left_symbol = if start_index > 0 {
                    self.inputs[input][start_index - 1]
                } else {
                    SENTINEL_SYMBOL
                };

                let mut map = HashMap::new();
                map.insert(
                    left_symbol,
                    vec![StartPosition {
                        start: start_index,
                        input,
                    }],
                );
                map
            })
            .collect()
    }

    /// Merge a list of `left_symbol → positions` maps into a single map.
    ///
    /// Maps from different children are combined so that positions sharing the
    /// same left symbol end up in the same bucket.
    fn merge_maps(
        maps: Vec<HashMap<SymbolType, Vec<StartPosition>>>,
    ) -> HashMap<SymbolType, Vec<StartPosition>> {
        let mut result = HashMap::new();

        for map in maps {
            for (key, positions) in map {
                result.entry(key).or_insert_with(Vec::new).extend(positions);
            }
        }

        result
    }

    /// Generate all maximal pairs from the children's maps at a given depth.
    ///
    /// A match is a *maximal exact match* (MEM) when it cannot be extended in
    /// either direction without introducing a mismatch:
    ///
    /// - **Right maximality** is guaranteed by the tree structure itself:
    ///   positions coming from *different* child maps diverged at the current
    ///   internal node, meaning they were reached via different edge symbols.
    ///   The symbol immediately after the shared prefix therefore already
    ///   differs between the two groups — no explicit check is needed.
    ///
    /// - **Left maximality** is checked explicitly by comparing the `left_symbol`
    ///   of each position (the symbol immediately before the match).  Two
    ///   groups are left-maximal with respect to each other when their
    ///   `left_symbol` values differ or when one group is at the very start of
    ///   its sequence (sentinel [`usize::MAX`]).
    ///
    /// All position pairs that satisfy both conditions are forwarded to
    /// [`Self::process_position_pairs`] for recording.
    fn generate_pairs(
        &self,
        depth: usize,
        children_maps: &[HashMap<SymbolType, Vec<StartPosition>>],
        collector: &mut MatchCollector,
    ) {
        for (i, map) in children_maps.iter().enumerate() {
            for (&left_symbol, positions1) in map {
                self.process_pairs_with_subsequent_maps(
                    &children_maps[(i + 1)..],
                    left_symbol,
                    positions1,
                    depth,
                    collector,
                );
            }
        }
    }

    /// Compare `positions1` against every bucket in the subsequent children maps.
    ///
    /// For each `(other_left_symbol, positions2)` bucket in `subsequent_maps`, the
    /// pair is eligible for recording only when [`Self::should_process_pair`]
    /// returns `true` (i.e., the left symbols differ, indicating maximality).
    fn process_pairs_with_subsequent_maps(
        &self,
        subsequent_maps: &[HashMap<SymbolType, Vec<StartPosition>>],
        left_symbol: SymbolType,
        positions1: &[StartPosition],
        depth: usize,
        collector: &mut MatchCollector,
    ) {
        for other_map in subsequent_maps {
            for (&other_left_symbol, positions2) in other_map {
                if self.should_process_pair(left_symbol, other_left_symbol) {
                    self.process_position_pairs(positions1, positions2, depth, collector);
                }
            }
        }
    }

    /// Returns `true` when the two left symbols indicate that this pair
    /// should be recorded.
    ///
    /// Two conditions trigger a `true`:
    /// - The symbols differ.
    /// - Either symbol is [`usize::MAX`], the start-of-sequence sentinel
    ///   used when a suffix begins at position 0 and has no left neighbour.
    ///   Because no real symbol can equal [`usize::MAX`], this sentinel is
    ///   always treated as distinct from any other value, including another
    ///   sentinel (two suffixes both starting at position 0 in different inputs
    ///   should still be paired).
    #[inline]
    fn should_process_pair(&self, left_symbol: SymbolType, other_left_symbol: SymbolType) -> bool {
        // Process pairs where left symbols differ, or where left_symbol is STRING_SENTINEL (start of string)
        other_left_symbol != left_symbol || left_symbol == SENTINEL_SYMBOL
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
    /// returning the merged left-symbol map for this subtree.
    ///
    /// The core idea is a **bottom-up traversal**: every internal node in the
    /// suffix tree represents a substring shared by all suffixes in its subtree.
    /// By the time we return from a node's children, we know — for each suffix
    /// in the subtree — what symbol appears immediately to the *left* of that
    /// shared substring (the `left_symbol`).  We collect these into per-child
    /// `left_symbol → positions` maps (see [`Self::create_leaf_maps`] for leaves,
    /// [`Self::collect_children_maps`] for internal nodes).
    ///
    /// At each internal node we then compare the maps of every pair of children
    /// (see [`Self::generate_pairs`]).  Because the children diverged at this
    /// node, their suffixes already differ on the *right* — so right-maximality
    /// is free.  Left-maximality is checked by comparing `left_symbol` values:
    /// two occurrences form a MEM only when their left symbols differ
    /// (or one is at the start of its sequence).
    ///
    /// Finally, the children's maps are merged and propagated upward so that
    /// the parent node can repeat the same comparison at a greater depth.
    fn find_maximal_pairs(
        &self,
        node_index: usize,
        depth: usize,
        collector: &mut MatchCollector,
    ) -> HashMap<SymbolType, Vec<StartPosition>> {
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

    /// Recursively process all children of `node` and collect their left-symbol maps.
    ///
    /// Each child's subtree is visited via [`Self::find_maximal_pairs`], which
    /// both records any MEMs found below in the [`MatchCollector`] and returns
    /// the merged left-symbol map for that child.
    fn collect_children_maps(
        &self,
        node: &Node,
        node_depth: usize,
        collector: &mut MatchCollector,
    ) -> Vec<HashMap<SymbolType, Vec<StartPosition>>> {
        node.children
            .as_ref()
            .expect("Node must have children")
            .values()
            .map(|&child_index| self.find_maximal_pairs(child_index, node_depth, collector))
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::suffixtree::suffixtree::SuffixTree;

    pub fn str_to_nodes(s: &str) -> Vec<SymbolType> {
        s.as_bytes().iter().map(|&b| b as SymbolType).collect()
    }

    #[test]
    fn test_identical_inputs() {
        let input = vec![str_to_nodes("ABC$"), str_to_nodes("ABC$")];

        let tree = SuffixTree::new(&input);
        let analyzer = MaximalMatchAnalyzer::new(&tree, &input, 1);
        let result = analyzer.analyze();

        // Both inputs are identical, so the similarity should be 1.0
        assert_eq!(*result.similarities.get(0, 1), 1.0);
        assert_eq!(*result.longest_fragments.get(0, 1), 3); // "ABC" without the $
    }

    #[test]
    fn test_non_overlapping_inputs() {
        let input = vec![str_to_nodes("ABC$"), str_to_nodes("DEF$")];

        let tree = SuffixTree::new(&input);
        let analyzer = MaximalMatchAnalyzer::new(&tree, &input, 1);
        let result = analyzer.analyze();

        // No overlap
        assert_eq!(*result.similarities.get(0, 1), 0.0);
        assert_eq!(*result.longest_fragments.get(0, 1), 0);
    }

    #[test]
    fn test_partial_overlap() {
        let input = vec![str_to_nodes("ABCDEF$"), str_to_nodes("XYZABC$")];

        let tree = SuffixTree::new(&input);
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
            str_to_nodes("XYZW$"),
        ];

        let tree = SuffixTree::new(&input);
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
        let input = vec![str_to_nodes("ABCDEF$"), str_to_nodes("XYZABC$")];

        let tree = SuffixTree::new(&input);
        // With min_match_length = 5, "ABC" (length 3) should not be counted
        let analyzer = MaximalMatchAnalyzer::new(&tree, &input, 5);
        let result = analyzer.analyze();

        assert_eq!(*result.longest_fragments.get(0, 1), 0);
    }
}
