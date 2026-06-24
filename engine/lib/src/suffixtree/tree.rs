use crate::suffixtree::maximal_match::MaximalMatchAnalyzer;
use crate::suffixtree::node::Node;
use crate::suffixtree::tree_builder::UkkonenBuilder;
use crate::suffixtree::types::AnalysisResult;
use crate::suffixtree::types::SymbolType;

/// A generalized suffix tree implementation.
#[derive(Debug, PartialEq)]
pub struct SuffixTree {
    /// Arena containing all nodes in the tree. The root is always at index 0.
    pub arena: Vec<Node>,
}

impl SuffixTree {
    /// Creates a new `SuffixTree` from the given sequences, building it immediately.
    pub fn build(sequences: &[Vec<SymbolType>]) -> Self {
        let mut tree = SuffixTree { arena: vec![Node::create_root()] };
        UkkonenBuilder::new().add_sequences(sequences, &mut tree);
        tree
    }

    /// Run maximal-match analysis on this suffix tree, returning pairwise
    /// similarity and longest-fragment results.
    ///
    /// * `sequences` — fingerprint sequences for the files being analyzed.
    /// * `min_match_length` — minimum shared substring length to record as a match.
    /// * `keep_fragments` — when `true`, raw matches are retained for fragment resolution.
    /// * `exclude_ignored` — when `true`, fingerprints marked as ignored (via
    ///   [`add_ignored_sequences`] or the `max_file_count` cap) are omitted from similarity
    ///   calculations.
    /// * `max_file_count` — suppress substrings that appear in more than these many distinct
    ///   files (boilerplate filter). `None` disables the cap.
    pub fn analyze(
        &mut self,
        sequences: &[Vec<SymbolType>],
        min_match_length: usize,
        keep_fragments: bool,
        exclude_ignored: bool,
        max_file_count: Option<usize>,
    ) -> AnalysisResult {
        MaximalMatchAnalyzer::new(
            self,
            sequences,
            min_match_length,
            keep_fragments,
            exclude_ignored,
            max_file_count,
        )
        .analyze()
    }

    /// Mark all nodes in the tree that are reachable by any suffix of any
    /// ignored sequence as `ignore = true`.
    pub fn add_ignored_sequences(
        &mut self,
        sequences: &[Vec<SymbolType>],
        ignored_sequences: &[Vec<SymbolType>],
    ) {
        for ignored_sequence in ignored_sequences {
            self.mark_substrings(sequences, ignored_sequence);
        }
    }

    /// Mark all tree nodes reachable by any suffix of `sequence`.
    fn mark_substrings(&mut self, sequences: &[Vec<SymbolType>], sequence: &[SymbolType]) {
        for start in 0..sequence.len() {
            self.mark_sequence(sequences, &sequence[start..]);
        }
    }

    /// Walk `sequence` through the tree, marking each node whose full incoming
    /// edge is consumed by the sequence.
    fn mark_sequence(&mut self, sequences: &[Vec<SymbolType>], sequence: &[SymbolType]) {
        let mut seq_pos = 0;
        let mut node_idx = 0; // root: range.length() == 0, always at a node boundary

        while seq_pos < sequence.len() {
            // Descend to the child whose edge starts with the next unmatched symbol.
            let Some(&child_idx) = self.arena[node_idx].get_child(sequence[seq_pos]) else {
                return; // no matching child — sequence not in tree
            };
            node_idx = child_idx;

            let node = &self.arena[node_idx];
            let edge_len = node.range.length();

            if sequence.len() - seq_pos < edge_len {
                return;
            }

            let seq_chunk = &sequence[seq_pos..seq_pos + edge_len];
            let edge_chunk =
                &sequences[node.range.sequence_index][node.range.start..node.range.end];

            if seq_chunk != edge_chunk {
                return;
            }

            self.arena[node_idx].ignore = true;
            seq_pos += edge_len;
        }
    }
}

#[cfg(test)]
pub mod suffixtree_test_utils {
    use crate::suffixtree::tree::SuffixTree;
    use crate::suffixtree::types::SymbolType;

    pub fn str_to_nodes(s: &str) -> Vec<SymbolType> {
        s.as_bytes().iter().map(|&b| b as SymbolType).collect()
    }

    fn search_pattern(
        tree: &SuffixTree,
        sequences: &[Vec<SymbolType>],
        pattern: &[SymbolType],
    ) -> Option<usize> {
        if pattern.is_empty() {
            return Some(0);
        }

        let (mut node_index, mut edge_offset) = (0, 0);
        for &symbol in pattern {
            let node = &tree.arena[node_index];
            if edge_offset < node.range.length() {
                if sequences[node.range.sequence_index][node.range.start + edge_offset] != symbol {
                    return None;
                }
                edge_offset += 1;
                continue;
            }

            node_index = *node.get_child(symbol)?;
            edge_offset = 1;
        }

        Some(node_index)
    }

    pub fn tree_contains(
        tree: &SuffixTree,
        sequences: &[Vec<SymbolType>],
        pattern: &[SymbolType],
    ) -> bool {
        search_pattern(tree, sequences, pattern).is_some()
    }

    pub fn tree_all_suffix_indices(
        tree: &SuffixTree,
        sequences: &[Vec<SymbolType>],
        pattern: &[SymbolType],
    ) -> Vec<usize> {
        let Some(end_node) = search_pattern(tree, sequences, pattern) else {
            return vec![];
        };

        let mut suffix_indices_list = Vec::new();
        let mut stack = vec![end_node];
        while let Some(current) = stack.pop() {
            let node = &tree.arena[current];
            match (&node.sequence_indices, &node.children) {
                (Some(sequence_indices), _) => {
                    suffix_indices_list.extend(sequence_indices.iter().copied())
                }
                (None, Some(children)) => stack.extend(children.values().copied()),
                (None, None) => unreachable!("Node must have either sequence indices or children"),
            }
        }

        suffix_indices_list
    }

    /// Returns `true` if the node reached by following `pattern` in the tree has `ignore = true`.
    pub fn node_is_ignored(
        tree: &SuffixTree,
        sequences: &[Vec<SymbolType>],
        pattern: &[SymbolType],
    ) -> bool {
        search_pattern(tree, sequences, pattern)
            .map(|idx| tree.arena[idx].ignore)
            .unwrap_or(false)
    }

    pub fn test_all_substrings(tree: &SuffixTree, sequences: &[Vec<SymbolType>]) {
        for (i, sequence) in sequences.iter().enumerate() {
            for start in 0..sequence.len() {
                for end in start + 1..=sequence.len() {
                    assert!(tree_contains(tree, sequences, &sequence[start..end]));
                    let vec = tree_all_suffix_indices(tree, sequences, &sequence[start..end]);
                    assert!(vec.contains(&i));
                }
            }
        }
    }
}

#[cfg(test)]
mod tests_build_single_sequence {
    use crate::suffixtree::node::{Node, Range};
    use crate::suffixtree::tree::SuffixTree;
    use crate::suffixtree::tree::suffixtree_test_utils::{str_to_nodes, test_all_substrings};
    use crate::suffixtree::types::{SENTINEL_SYMBOL, SymbolType};
    use std::collections::{HashMap, HashSet};

    #[test]
    fn test_small() {
        let sequences = vec![str_to_nodes("ABCD")];
        let tree = SuffixTree::build(&sequences);
        let control_tree = SuffixTree {
            #[rustfmt::skip]
            arena: vec![
                Node::new(Range::new(0, 0, 0), None, Some(HashMap::from([(65, 1), (66, 2), (67, 3), (68, 4), (SENTINEL_SYMBOL, 5)])), None, None),
                Node::new(Range::new(0, 4, 0), Some(0), None, None, Some(HashSet::from([0]))),
                Node::new(Range::new(1, 4, 0), Some(0), None, None, Some(HashSet::from([0]))),
                Node::new(Range::new(2, 4, 0), Some(0), None, None, Some(HashSet::from([0]))),
                Node::new(Range::new(3, 4, 0), Some(0), None, None, Some(HashSet::from([0]))),
                Node::new(Range::new(4, 4, 0), Some(0), None, None, Some(HashSet::from([0]))),
            ],
        };
        assert_eq!(tree, control_tree);
    }

    #[test]
    fn test_single_sequence() {
        let sequences = vec![str_to_nodes("ACACACGT")];
        let tree = SuffixTree::build(&sequences);
        let control_tree = SuffixTree {
            #[rustfmt::skip]
            arena: vec![
                Node::new(Range::new(0, 0, 0), None, Some(HashMap::from([(SENTINEL_SYMBOL, 13), (65, 7), (67, 9), (71, 11), (84, 12)])), None, None),
                Node::new(Range::new(4, 8, 0), Some(3), None, None, Some(HashSet::from([0]))),
                Node::new(Range::new(4, 8, 0), Some(5), None, None, Some(HashSet::from([0]))),
                Node::new(Range::new(2, 4, 0), Some(7), Some(HashMap::from([(65, 1), (b'G' as SymbolType, 4)])), Some(5), None),
                Node::new(Range::new(6, 8, 0), Some(3), None, None, Some(HashSet::from([0]))),
                Node::new(Range::new(2, 4, 0), Some(9), Some(HashMap::from([(65, 2), (b'G' as SymbolType, 6)])), Some(7), None),
                Node::new(Range::new(6, 8, 0), Some(5), None, None, Some(HashSet::from([0]))),
                Node::new(Range::new(0, 2, 0), Some(0), Some(HashMap::from([(65, 3), (b'G' as SymbolType, 8)])), Some(9), None),
                Node::new(Range::new(6, 8, 0), Some(7), None, None, Some(HashSet::from([0]))),
                Node::new(Range::new(1, 2, 0), Some(0), Some(HashMap::from([(65, 5), (b'G' as SymbolType, 10)])), Some(0), None),
                Node::new(Range::new(6, 8, 0), Some(9), None, None, Some(HashSet::from([0]))),
                Node::new(Range::new(6, 8, 0), Some(0), None, None, Some(HashSet::from([0]))),
                Node::new(Range::new(7, 8, 0), Some(0), None, None, Some(HashSet::from([0]))),
                Node::new(Range::new(8, 8, 0), Some(0), None, None, Some(HashSet::from([0]))),
            ],
        };
        assert_eq!(tree, control_tree);
    }

    #[test]
    fn test_large_alphabet() {
        let sequences = vec![(11500..12000).map(|i| i as SymbolType).collect()];
        let tree = SuffixTree::build(&sequences);
        test_all_substrings(&tree, &sequences);
    }
}

#[cfg(test)]
mod tests_build_multiple_sequences {
    use crate::suffixtree::node::{Node, Range};
    use crate::suffixtree::tree::SuffixTree;
    use crate::suffixtree::tree::suffixtree_test_utils::{str_to_nodes, test_all_substrings};
    use crate::suffixtree::types::{SENTINEL_SYMBOL, SymbolType};
    use rand::{RngExt, SeedableRng, rngs::StdRng};
    use std::collections::{HashMap, HashSet};

    #[test]
    fn test_two_non_overlapping_sequences() {
        let sequences = vec![str_to_nodes("ABC"), str_to_nodes("DEF")];
        let tree = SuffixTree::build(&sequences);
        let control_tree = SuffixTree {
            #[rustfmt::skip]
            arena: vec![
                Node::new(Range::new(0, 0, 0), None, Some(HashMap::from([(65, 1), (66, 2), (67, 3), (68, 5), (69, 6), (70, 7), (SENTINEL_SYMBOL, 4)])), None, None),
                Node::new(Range::new(0, 3, 0), Some(0), None, None, Some(HashSet::from([0]))),
                Node::new(Range::new(1, 3, 0), Some(0), None, None, Some(HashSet::from([0]))),
                Node::new(Range::new(2, 3, 0), Some(0), None, None, Some(HashSet::from([0]))),
                Node::new(Range::new(3, 3, 0), Some(0), None, None, Some(HashSet::from([0, 1]))),
                Node::new(Range::new(0, 3, 1), Some(0), None, None, Some(HashSet::from([1]))),
                Node::new(Range::new(1, 3, 1), Some(0), None, None, Some(HashSet::from([1]))),
                Node::new(Range::new(2, 3, 1), Some(0), None, None, Some(HashSet::from([1]))),
            ],
        };
        assert_eq!(tree, control_tree);
    }

    #[test]
    fn test_two_overlapping_begin_sequences() {
        let sequences = vec![str_to_nodes("XYAB"), str_to_nodes("XYCD")];
        let tree = SuffixTree::build(&sequences);
        let control_tree = SuffixTree {
            #[rustfmt::skip]
            arena: vec![
                Node::new(Range::new(0, 0, 0), None, Some(HashMap::from([(65, 3), (66, 4), (67, 10), (68, 11), (88, 6), (89, 8), (SENTINEL_SYMBOL, 5)])), None, None),
                Node::new(Range::new(2, 4, 0), Some(6), None, None, Some(HashSet::from([0]))),
                Node::new(Range::new(2, 4, 0), Some(8), None, None, Some(HashSet::from([0]))),
                Node::new(Range::new(2, 4, 0), Some(0), None, None, Some(HashSet::from([0]))),
                Node::new(Range::new(3, 4, 0), Some(0), None, None, Some(HashSet::from([0]))),
                Node::new(Range::new(4, 4, 0), Some(0), None, None, Some(HashSet::from([0, 1]))),
                Node::new(Range::new(0, 2, 0), Some(0), Some(HashMap::from([(65, 1), (67, 7)])), Some(8), None),
                Node::new(Range::new(2, 4, 1), Some(6), None, None, Some(HashSet::from([1]))),
                Node::new(Range::new(1, 2, 0), Some(0), Some(HashMap::from([(65, 2), (67, 9)])), Some(0), None),
                Node::new(Range::new(2, 4, 1), Some(8), None, None, Some(HashSet::from([1]))),
                Node::new(Range::new(2, 4, 1), Some(0), None, None, Some(HashSet::from([1]))),
                Node::new(Range::new(3, 4, 1), Some(0), None, None, Some(HashSet::from([1]))),
            ],
        };
        assert_eq!(tree, control_tree);
    }

    #[test]
    fn test_two_overlapping_end_sequences() {
        let sequences = vec![str_to_nodes("ABXY"), str_to_nodes("CDXY")];
        let tree = SuffixTree::build(&sequences);
        let control_tree = SuffixTree {
            #[rustfmt::skip]
            arena: vec![
                Node::new(Range::new(0, 0, 0), None, Some(HashMap::from([(65, 1), (66, 2), (67, 6), (68, 7), (88, 3), (89, 4), (SENTINEL_SYMBOL, 5)])), None, None),
                Node::new(Range::new(0, 4, 0), Some(0), None, None, Some(HashSet::from([0]))),
                Node::new(Range::new(1, 4, 0), Some(0), None, None, Some(HashSet::from([0]))),
                Node::new(Range::new(2, 4, 0), Some(0), None, None, Some(HashSet::from([0, 1]))),
                Node::new(Range::new(3, 4, 0), Some(0), None, None, Some(HashSet::from([0, 1]))),
                Node::new(Range::new(4, 4, 0), Some(0), None, None, Some(HashSet::from([0, 1]))),
                Node::new(Range::new(0, 4, 1), Some(0), None, None, Some(HashSet::from([1]))),
                Node::new(Range::new(1, 4, 1), Some(0), None, None, Some(HashSet::from([1]))),
            ],
        };
        assert_eq!(tree, control_tree);
    }

    #[test]
    fn test_multiple_sequences() {
        let sequences = vec![
            str_to_nodes("MISSISSIPPI"),
            str_to_nodes("BANANA"),
            str_to_nodes("BANASSIPPI"),
        ];
        let tree = SuffixTree::build(&sequences);
        test_all_substrings(&tree, &sequences);
    }

    #[test]
    fn test_large_random() {
        let mut rng = StdRng::seed_from_u64(42);
        let sequences: Vec<Vec<SymbolType>> = (0..50)
            .map(|_| {
                (0..50)
                    .map(|_| (rng.random::<u8>() % 10 + 65) as SymbolType)
                    .collect()
            })
            .collect();
        let tree = SuffixTree::build(&sequences);
        test_all_substrings(&tree, &sequences);
    }
}

#[cfg(test)]
mod tests_analysis {
    use crate::suffixtree::tree::SuffixTree;
    use crate::suffixtree::tree::suffixtree_test_utils::str_to_nodes;
    use crate::suffixtree::types::{AnalysisResult, SymbolType};

    fn analyze(sequences: &[Vec<SymbolType>], min_match_length: usize) -> AnalysisResult {
        let mut tree = SuffixTree::build(sequences);
        tree.analyze(sequences, min_match_length, false, false, None)
    }

    #[test]
    fn test_identical_sequences() {
        let sequences = vec![str_to_nodes("ABC"), str_to_nodes("ABC")];
        let result = analyze(&sequences, 1);
        let m = result.metrics.get(0, 1);
        assert_eq!(m.similarity, 1.0);
        assert_eq!(m.longest_fragment, 3);
        assert_eq!(m.total_left, 3);
        assert_eq!(m.total_right, 3);
        assert_eq!(m.overlap_left, 3);
        assert_eq!(m.overlap_right, 3);
    }

    #[test]
    fn test_non_overlapping_sequences() {
        let sequences = vec![str_to_nodes("ABC"), str_to_nodes("DEF")];
        let result = analyze(&sequences, 1);
        let m = result.metrics.get(0, 1);
        assert_eq!(m.similarity, 0.0);
        assert_eq!(m.longest_fragment, 0);
        assert_eq!(m.overlap_left, 0);
        assert_eq!(m.overlap_right, 0);
    }

    #[test]
    fn test_partial_overlapping_sequences() {
        // "ABC" is the only shared fragment
        let sequences = vec![str_to_nodes("ABCDEF"), str_to_nodes("XYZABC")];
        let result = analyze(&sequences, 1);
        let m = result.metrics.get(0, 1);
        assert_eq!(m.longest_fragment, 3);
        assert_eq!(m.similarity, 0.5);
        assert_eq!(m.total_left, 6);
        assert_eq!(m.total_right, 6);
        assert_eq!(m.overlap_left, 3);
        assert_eq!(m.overlap_right, 3);
    }

    #[test]
    fn test_three_sequence() {
        let sequences = vec![
            str_to_nodes("ABCD"),
            str_to_nodes("ABCE"),
            str_to_nodes("XYZW"),
        ];
        let result = analyze(&sequences, 1);

        // Sequences 0 and 1 share "ABC"
        let m01 = result.metrics.get(0, 1);
        assert_eq!(m01.longest_fragment, 3);
        assert_eq!(m01.similarity, 0.75);

        // Sequences 0 and 2 share nothing
        let m02 = result.metrics.get(0, 2);
        assert_eq!(m02.longest_fragment, 0);
        assert_eq!(m02.similarity, 0.0);

        // Sequences 1 and 2 share nothing
        let m12 = result.metrics.get(1, 2);
        assert_eq!(m12.longest_fragment, 0);
        assert_eq!(m12.similarity, 0.0);
    }

    #[test]
    fn test_matches_below_min_length() {
        // "ABC" has length 3, which is below min_match_length 5 → not counted
        let sequences = vec![str_to_nodes("ABCDEF"), str_to_nodes("XYZABC")];
        assert_eq!(analyze(&sequences, 5).metrics.get(0, 1).longest_fragment, 0);
    }
}

#[cfg(test)]
mod tests_ignored {
    use crate::suffixtree::tree::SuffixTree;
    use crate::suffixtree::tree::suffixtree_test_utils::{node_is_ignored, str_to_nodes};

    #[test]
    fn test_ignored_nodes_in_tree() {
        let sequences = vec![str_to_nodes("XYABZ"), str_to_nodes("XYCDZ")];
        let ignored_sequences = vec![str_to_nodes("XY")];

        let mut tree = SuffixTree::build(&sequences);
        tree.add_ignored_sequences(&sequences, &ignored_sequences);

        // Substrings of the ignored sequence must be marked.
        assert!(node_is_ignored(&tree, &sequences, &str_to_nodes("XY")));
        assert!(node_is_ignored(&tree, &sequences, &str_to_nodes("Y")));

        // Nodes that are not substrings of the ignored sequence must not be marked.
        assert!(!node_is_ignored(&tree, &sequences, &str_to_nodes("ABZ")));
        assert!(!node_is_ignored(&tree, &sequences, &str_to_nodes("CDZ")));
        assert!(!node_is_ignored(&tree, &sequences, &str_to_nodes("XYABZ")));
        assert!(!node_is_ignored(&tree, &sequences, &str_to_nodes("XYCDZ")));
    }

    #[test]
    fn test_ignored_excluded_from_metrics() {
        // "XY" is ignored; "Z" (length 1) is the only remaining shared fragment.
        let sequences = vec![str_to_nodes("XYABZ"), str_to_nodes("XYCDZ")];
        let ignored_sequences = vec![str_to_nodes("XY")];

        let mut tree = SuffixTree::build(&sequences);
        tree.add_ignored_sequences(&sequences, &ignored_sequences);

        // keep_fragments = true so we can inspect Match::ignored flags.
        let result = tree.analyze(&sequences, 1, true, true, None);

        let m = result.metrics.get(0, 1);
        // Only "Z" contributes — "XY" must not inflate longest_fragment.
        assert_eq!(m.longest_fragment, 1);
        // Each sequence has 5 tokens; 2 ("XY") are ignored → effective length 3.
        assert_eq!(m.total_left, 3);
        assert_eq!(m.total_right, 3);
        assert_eq!(m.overlap_left, 1);
        assert_eq!(m.overlap_right, 1);

        // Stored matches must carry the correct ignored flag.
        let pair_matches = result.matches.as_ref().unwrap().get(0, 1);
        let ignored_match = pair_matches.iter().find(|m| m.length == 2);
        let non_ignored_match = pair_matches.iter().find(|m| m.length == 1);
        assert!(matches!(ignored_match, Some(m) if m.ignored));
        assert!(matches!(non_ignored_match, Some(m) if !m.ignored));
    }

    #[test]
    fn test_ignore_frequent_fingerprints() {
        let sequences = vec![
            str_to_nodes("XYABZ"),
            str_to_nodes("XYCDZ"),
            str_to_nodes("XYEFD"),
        ];
        let mut tree = SuffixTree::build(&sequences);
        let result = tree.analyze(&sequences, 1, false, true, Some(2));

        let m01 = result.metrics.get(0, 1);
        let m02 = result.metrics.get(0, 2);
        let m12 = result.metrics.get(1, 2);

        assert_eq!(m01.longest_fragment, 1);
        assert_eq!(m01.overlap_right, 1);
        assert_eq!(m01.overlap_left, 1);
        assert_eq!(m01.total_right, 3);
        assert_eq!(m01.total_left, 3);

        assert_eq!(m02.longest_fragment, 0);
        assert_eq!(m02.overlap_right, 0);
        assert_eq!(m02.overlap_left, 0);
        assert_eq!(m02.total_right, 3);
        assert_eq!(m02.total_left, 3);

        assert_eq!(m12.longest_fragment, 1);
        assert_eq!(m12.overlap_right, 1);
        assert_eq!(m12.overlap_left, 1);
        assert_eq!(m12.total_right, 3);
        assert_eq!(m12.total_left, 3);
    }
}
