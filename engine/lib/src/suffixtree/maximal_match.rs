use crate::ignore::IgnoredFingerprints;
use crate::suffixtree::match_collector::MatchCollector;
use crate::suffixtree::node::Node;
use crate::suffixtree::tree::SuffixTree;
use crate::suffixtree::types::{AnalysisResult, SENTINEL_SYMBOL, StartPosition, SymbolType};
use std::collections::HashMap;

type LeftMap = HashMap<SymbolType, Vec<StartPosition>>;

/// Analyzer for finding maximal exact matches in a generalized suffix tree.
///
/// A *maximal exact match* (MEM) between two sequences is a shared substring
/// that cannot be extended in either direction without introducing a mismatch.
/// This analyzer traverses the suffix tree bottom-up, collecting left-extension
/// symbols at each internal node to identify MEMs and report pairwise
/// similarity statistics.
pub struct MaximalMatchAnalyzer<'a> {
    /// The generalized suffix tree built from all sequences.
    tree: &'a SuffixTree,
    /// The original sequences, without explicit end-of-sequence sentinels.
    sequences: &'a [Vec<SymbolType>],
    /// Only matches of at least this many tokens are considered.
    min_match_length: usize,
    /// Whether to keep fragments of all the similar matches.
    pub keep_fragments: bool,
    /// Which fingerprint positions are ignored; forwarded to the collector.
    ignored: &'a IgnoredFingerprints,
}

impl<'a> MaximalMatchAnalyzer<'a> {
    /// Create a new [`MaximalMatchAnalyzer`].
    ///
    /// # Arguments
    /// * `tree` – Generalized suffix tree built from all `sequences`.
    /// * `sequences` – The sequences to analyze.
    /// * `ignored` – Which fingerprint positions are ignored.
    /// * `min_match_length` – Minimum number of tokens a shared substring must
    ///   have to be counted as a match.
    /// * `keep_fragments` – Whether to store raw matches for fragment resolution.
    pub fn new(
        tree: &'a SuffixTree,
        sequences: &'a [Vec<SymbolType>],
        ignored: &'a IgnoredFingerprints,
        min_match_length: usize,
        keep_fragments: bool,
    ) -> Self {
        Self { tree, sequences, ignored, min_match_length, keep_fragments }
    }

    /// Perform the full MEM analysis and return pairwise similarity results.
    ///
    /// Traverses the suffix tree depth-first, identifies all maximal exact
    /// matches that meet `min_match_length`, and aggregates them into an
    /// [`AnalysisResult`] containing per-pair similarity scores and longest
    /// fragment lengths.
    ///
    /// A match is suppressed only when its length does not meet
    /// `min_match_length`.
    pub fn analyze(&mut self) -> AnalysisResult {
        let mut collector = MatchCollector::new(
            self.sequences,
            self.ignored,
            self.min_match_length,
            self.keep_fragments,
        );
        self.find_maximal_pairs(0, 0, &mut collector);
        collector.into_result()
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
    /// (or one is at the start of its sequence).
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
            if node_depth >= self.min_match_length {
                self.absorb_child_map(node_depth, &mut accumulator, child_map, collector);
            }
        }

        accumulator.unwrap_or_default()
    }

    /// Build the left-symbol maps for a leaf node.
    ///
    /// Each leaf represents a suffix from one or more sequences. For every
    /// sequence stored at this leaf, the method computes the start index of the
    /// suffix (given the current string `depth`) and records the symbol
    /// immediately to the *left* of that suffix (i.e., the symbol that would
    /// need to match for the current shared substring to be extended leftward).
    /// [`usize::MAX`] is used as a sentinel when the suffix starts at position 0.
    ///
    /// Returns one map per leaf occurrence so pair generation can reuse the same
    /// logic as internal nodes.
    fn create_leaf_maps(&self, node: &Node, depth: usize) -> Vec<LeftMap> {
        node.sequence_indices
            .as_ref()
            .expect("Leaf node must have sequence indices")
            .iter()
            .map(|&sequence_index| {
                let sequence_len = self.sequences[sequence_index].len();
                let start_index = sequence_len - depth;
                let left_symbol = if start_index > 0 {
                    self.sequences[sequence_index][start_index - 1]
                } else {
                    SENTINEL_SYMBOL
                };

                let mut map = HashMap::new();
                map.insert(
                    left_symbol,
                    vec![StartPosition { start: start_index, sequence_index }],
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
        for (&left_symbol, left_pos) in child_map {
            for (&other_left_symbol, other_left_pos) in accumulator {
                if Self::should_process_pair(left_symbol, other_left_symbol) {
                    self.process_position_pairs(left_pos, other_left_pos, depth, collector);
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
            target.entry(key).or_default().append(&mut positions);
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
        match &node.children {
            None => self.create_leaf_maps(node, node_depth),
            Some(children) => {
                let child_indices: Vec<usize> = children.values().copied().collect();
                child_indices
                    .iter()
                    .map(|&ci| self.find_maximal_pairs(ci, node_depth, collector))
                    .collect()
            }
        }
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
            self.generate_pairs_against_accumulator(node_depth, acc, &child_map, collector);
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
    /// - Either symbol is [`SENTINEL_SYMBOL`], the start-of-sequence sentinel
    ///   used when a suffix begins at position 0 and has no left neighbor.
    ///   Because no real symbol can equal [`SENTINEL_SYMBOL`], this sentinel is
    ///   always treated as distinct from any other value, including another
    ///   sentinel (two suffixes both starting at position 0 in different sequences
    ///   should still be paired).
    #[inline]
    fn should_process_pair(left_symbol: SymbolType, other_left_symbol: SymbolType) -> bool {
        other_left_symbol != left_symbol || left_symbol == SENTINEL_SYMBOL
    }

    /// Record a match for every cross-sequence pair between `positions1` and `positions2`.
    ///
    /// Positions that belong to the *same* sequence are skipped — a suffix can only
    /// form a meaningful plagiarism signal when it appears in two *different*
    /// source files. For each valid cross-sequence pair the current string `depth`
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
                if sp1.sequence_index != sp2.sequence_index {
                    collector.record_match(sp1, sp2, depth);
                }
            }
        }
    }
}
