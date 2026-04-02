use crate::suffixtree::match_collector::MatchCollector;
use crate::suffixtree::node::Node;
use crate::suffixtree::suffixtree::SuffixTree;
use crate::suffixtree::types::AnalysisResult;
use crate::suffixtree::types::{SENTINEL_SYMBOL, StartPosition, SymbolType};
use std::collections::HashMap;

type LeftMap = HashMap<SymbolType, Vec<StartPosition>>;

/// Analyzer for finding maximal exact matches in a generalized suffix tree.
///
/// A *maximal exact match* (MEM) between two words is a shared substring
/// that cannot be extended in either direction without introducing a mismatch.
/// This analyzer traverses the suffix tree bottom-up, collecting left-extension
/// symbols at each internal node to identify MEMs and report pairwise
/// similarity statistics.
pub struct MaximalMatchAnalyzer<'a> {
    /// The generalized suffix tree built from all words.
    tree: &'a SuffixTree,
    /// The original words, without explicit end-of-word sentinels.
    words: &'a [Vec<SymbolType>],
    /// Only matches of at least this many tokens are considered
    min_match_length: usize,
    /// Whether to keep fragments of all the similar matches.
    pub keep_fragments: bool,
}

impl<'a> MaximalMatchAnalyzer<'a> {
    /// Create a new [`MaximalMatchAnalyzer`].
    ///
    /// # Arguments
    /// * `tree` – Generalized suffix tree built from all `words`.
    /// * `words` – The original words.
    /// * `min_match_length` – Minimum number of tokens a shared substring must
    ///   have to be counted as a match.
    pub fn new(
        tree: &'a SuffixTree,
        words: &'a [Vec<SymbolType>],
        min_match_length: usize,
        keep_fragments: bool,
    ) -> Self {
        Self { tree, words, min_match_length, keep_fragments }
    }

    /// Perform the full MEM analysis and return pairwise similarity results.
    ///
    /// Traverses the suffix tree depth-first, identifies all maximal exact
    /// matches that meet `min_match_length`, and aggregates them into an
    /// [`AnalysisResult`] containing per-pair similarity scores and longest
    /// fragment lengths.
    pub fn analyze(&self) -> AnalysisResult {
        let mut collector = MatchCollector::new(self.words, self.keep_fragments);

        // Find all maximal pairs starting from the root
        self.find_maximal_pairs(0, 0, &mut collector);

        collector.into_result()
    }

    /// Build the left-symbol maps for a leaf node.
    ///
    /// Each leaf represents a suffix from one or more words. For every
    /// word stored at this leaf, the method computes the start index of the
    /// suffix (given the current string `depth`) and records the symbol
    /// immediately to the *left* of that suffix (i.e., the symbol that would
    /// need to match for the current shared substring to be extended leftward).
    /// [`usize::MAX`] is used as a sentinel when the suffix starts at position 0.
    ///
    /// Returns one map per leaf occurrence so pair generation can reuse the same
    /// logic as internal nodes.
    fn create_leaf_maps(&self, node: &Node, depth: usize) -> Vec<LeftMap> {
        node.word_indices
            .as_ref()
            .expect("Leaf node must have words")
            .iter()
            .map(|&word_index| {
                let word_len = self.words[word_index].len();
                let start_index = word_len - depth;
                let left_symbol = if start_index > 0 {
                    self.words[word_index][start_index - 1]
                } else {
                    SENTINEL_SYMBOL
                };

                let mut map = HashMap::new();
                map.insert(
                    left_symbol,
                    vec![StartPosition { start: start_index, word_index }],
                );
                map
            })
            .collect()
    }

    /// Record MEM pairs between one new child map and already-seen children.
    fn generate_pairs_against_accumulator(
        &self,
        depth: usize,
        accumulator: &LeftMap,
        child_map: &LeftMap,
        collector: &mut MatchCollector,
    ) {
        for (&left_symbol, positions1) in child_map {
            for (&other_left_symbol, positions2) in accumulator {
                if Self::should_process_pair(left_symbol, other_left_symbol) {
                    self.process_position_pairs(positions1, positions2, depth, collector);
                }
            }
        }
    }

    /// Merge `other` into `target` using a small-to-large strategy.
    fn merge_into(target: &mut LeftMap, mut other: LeftMap) {
        if target.len() < other.len() {
            std::mem::swap(target, &mut other);
        }

        for (key, mut positions) in other {
            target
                .entry(key)
                .or_insert_with(Vec::new)
                .append(&mut positions);
        }
    }

    /// Collect one `LeftMap` per child: leaf occurrences for leaf nodes, or the
    /// merged subtree map per child for internal nodes.
    fn collect_child_maps(
        &self,
        node: &Node,
        node_depth: usize,
        collector: &mut MatchCollector,
    ) -> Vec<LeftMap> {
        if node.children.is_none() {
            return self.create_leaf_maps(node, node_depth);
        }

        let mut maps = Vec::new();
        for &child_index in node
            .children
            .as_ref()
            .expect("Node must have children")
            .values()
        {
            maps.push(self.find_maximal_pairs(child_index, node_depth, collector));
        }
        maps
    }

    /// Process one child map into the current accumulator.
    fn absorb_child_map(
        &self,
        node_depth: usize,
        accumulator: &mut Option<LeftMap>,
        child_map: LeftMap,
        collector: &mut MatchCollector,
    ) {
        if let Some(acc) = accumulator.as_mut() {
            if node_depth >= self.min_match_length {
                self.generate_pairs_against_accumulator(node_depth, acc, &child_map, collector);
            }
            Self::merge_into(acc, child_map);
        } else {
            *accumulator = Some(child_map);
        }
    }

    /// Returns `true` when the two left symbols indicate that this pair
    /// should be recorded.
    ///
    /// Two conditions trigger a `true`:
    /// - The symbols differ.
    /// - Either symbol is [`usize::MAX`], the start-of-word sentinel
    ///   used when a suffix begins at position 0 and has no left neighbour.
    ///   Because no real symbol can equal [`usize::MAX`], this sentinel is
    ///   always treated as distinct from any other value, including another
    ///   sentinel (two suffixes both starting at position 0 in different words
    ///   should still be paired).
    #[inline]
    fn should_process_pair(left_symbol: SymbolType, other_left_symbol: SymbolType) -> bool {
        // Process pairs where left symbols differ, or where left_symbol is STRING_SENTINEL (start of string)
        other_left_symbol != left_symbol || left_symbol == SENTINEL_SYMBOL
    }

    /// Record a match for every cross-word pair between `positions1` and `positions2`.
    ///
    /// Positions that belong to the *same* word are skipped — a suffix can only
    /// form a meaningful plagiarism signal when it appears in two *different*
    /// source files. For each valid cross-word pair the current string `depth`
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
                if sp1.word_index != sp2.word_index {
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
    /// shared substring (the `left_symbol`).
    ///
    /// At each internal node we compare each child map against an accumulator of
    /// already processed children. Because the children diverged at this
    /// node, their suffixes already differ on the *right* — so right-maximality
    /// is free.  Left-maximality is checked by comparing `left_symbol` values:
    /// two occurrences form a MEM only when their left symbols differ
    /// (or one is at the start of its word).
    ///
    /// Finally, the children's maps are merged and propagated upward so that
    /// the parent node can repeat the same comparison at a greater depth.
    fn find_maximal_pairs(
        &self,
        node_index: usize,
        depth: usize,
        collector: &mut MatchCollector,
    ) -> LeftMap {
        let node = &self.tree.arena[node_index];
        let node_depth = depth + node.range.length();

        let mut accumulator: Option<LeftMap> = None;
        for child_map in self.collect_child_maps(node, node_depth, collector) {
            self.absorb_child_map(node_depth, &mut accumulator, child_map, collector);
        }

        accumulator.unwrap_or_default()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::suffixtree::suffixtree::SuffixTree;
    use crate::suffixtree::suffixtree::suffixtree_test_utils::str_to_nodes;

    #[test]
    fn test_identical_words() {
        let words = vec![str_to_nodes("ABC"), str_to_nodes("ABC")];

        let tree = SuffixTree::new(&words);
        let analyzer = MaximalMatchAnalyzer::new(&tree, &words, 1, false);
        let result = analyzer.analyze();

        // Both words are identical, so the similarity should be 1.0
        assert_eq!(*result.similarities.get(0, 1), 1.0);
        assert_eq!(*result.longest_fragments.get(0, 1), 3); // "ABC" without the $
    }

    #[test]
    fn test_non_overlapping_words() {
        let words = vec![str_to_nodes("ABC"), str_to_nodes("DEF")];

        let tree = SuffixTree::new(&words);
        let analyzer = MaximalMatchAnalyzer::new(&tree, &words, 1, false);
        let result = analyzer.analyze();

        // No overlap
        assert_eq!(*result.similarities.get(0, 1), 0.0);
        assert_eq!(*result.longest_fragments.get(0, 1), 0);
    }

    #[test]
    fn test_partial_overlap() {
        let words = vec![str_to_nodes("ABCDEF"), str_to_nodes("XYZABC")];

        let tree = SuffixTree::new(&words);
        let analyzer = MaximalMatchAnalyzer::new(&tree, &words, 1, false);
        let result = analyzer.analyze();

        // "ABC" is shared
        assert_eq!(*result.longest_fragments.get(0, 1), 3);
        assert_eq!(*result.similarities.get(0, 1), 0.5);
    }

    #[test]
    fn test_multiple_words() {
        let words = vec![
            str_to_nodes("ABCD"),
            str_to_nodes("ABCE"),
            str_to_nodes("XYZW"),
        ];

        let tree = SuffixTree::new(&words);
        let analyzer = MaximalMatchAnalyzer::new(&tree, &words, 1, false);
        let result = analyzer.analyze();

        // Word 0 and 1 share "ABC"
        assert_eq!(*result.longest_fragments.get(0, 1), 3);
        assert_eq!(*result.similarities.get(0, 1), 0.75);
        // Word 0 and 2 share nothing
        assert_eq!(*result.longest_fragments.get(0, 2), 0);
        assert_eq!(*result.similarities.get(0, 2), 0.0);
        // Word 1 and 2 share nothing
        assert_eq!(*result.longest_fragments.get(1, 2), 0);
        assert_eq!(*result.similarities.get(1, 2), 0.0);
    }

    #[test]
    fn test_min_match_length() {
        let words = vec![str_to_nodes("ABCDEF"), str_to_nodes("XYZABC")];

        let tree = SuffixTree::new(&words);
        // With min_match_length = 5, "ABC" (length 3) should not be counted
        let analyzer = MaximalMatchAnalyzer::new(&tree, &words, 5, false);
        let result = analyzer.analyze();

        assert_eq!(*result.longest_fragments.get(0, 1), 0);
    }
}
