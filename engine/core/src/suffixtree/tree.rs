use crate::Symbol;
use crate::collections::vec_bitmap::VecBitmap;
use crate::suffixtree::maximal_match::MaximalMatchAnalyzer;
use crate::suffixtree::node::Node;
use crate::suffixtree::tree_builder::UkkonenBuilder;
use crate::suffixtree::types::AnalysisResult;

/// A generalized suffix tree implementation.
#[derive(Debug, PartialEq)]
pub struct SuffixTree {
    /// Arena containing all nodes in the tree. The root is always at index 0.
    pub arena: Vec<Node>,
}

impl SuffixTree {
    /// Creates a new `SuffixTree` from the given sequences, building it immediately.
    pub fn build(sequences: &[Vec<Symbol>]) -> Self {
        let mut tree = SuffixTree { arena: vec![Node::create_root()] };
        UkkonenBuilder::new().add_sequences(sequences, &mut tree);
        tree
    }

    /// Run maximal-match analysis on this suffix tree, returning pairwise
    /// similarity and longest-match results.
    ///
    /// * `sequences` — the sequences being analyzed.
    /// * `ignored` — the set bits mark the ignored positions of each sequence;
    ///   matches are split at those positions before being recorded. `None`
    ///   ignores nothing.
    /// * `min_match_length` — minimum shared substring length to record as a match.
    /// * `keep_matches` — when `true`, the raw matches are kept in the result.
    pub fn analyze(
        &self,
        sequences: &[Vec<Symbol>],
        ignored_mask: Option<&VecBitmap>,
        min_match_length: usize,
        keep_matches: bool,
    ) -> AnalysisResult {
        MaximalMatchAnalyzer::new(
            self,
            sequences,
            ignored_mask,
            min_match_length,
            keep_matches,
        )
        .analyze()
    }
}

#[cfg(test)]
pub mod suffixtree_test_utils {
    use crate::Symbol;
    use crate::suffixtree::tree::SuffixTree;

    /// One symbol per byte of `s`.
    pub fn str_to_symbols(s: &str) -> Vec<Symbol> {
        s.as_bytes().iter().map(|&b| b as Symbol).collect()
    }

    fn search_pattern(
        tree: &SuffixTree,
        sequences: &[Vec<Symbol>],
        pattern: &[Symbol],
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

    pub fn tree_contains(tree: &SuffixTree, sequences: &[Vec<Symbol>], pattern: &[Symbol]) -> bool {
        search_pattern(tree, sequences, pattern).is_some()
    }

    pub fn tree_all_suffix_indices(
        tree: &SuffixTree,
        sequences: &[Vec<Symbol>],
        pattern: &[Symbol],
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

    pub fn test_all_substrings(tree: &SuffixTree, sequences: &[Vec<Symbol>]) {
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
    use crate::Symbol;
    use crate::suffixtree::node::{Node, Range};
    use crate::suffixtree::tree::SuffixTree;
    use crate::suffixtree::tree::suffixtree_test_utils::{str_to_symbols, test_all_substrings};
    use crate::suffixtree::types::SENTINEL_SYMBOL;
    use std::collections::{HashMap, HashSet};

    #[test]
    fn test_small() {
        let sequences = vec![str_to_symbols("ABCD")];
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
        let sequences = vec![str_to_symbols("ACACACGT")];
        let tree = SuffixTree::build(&sequences);
        let control_tree = SuffixTree {
            #[rustfmt::skip]
            arena: vec![
                Node::new(Range::new(0, 0, 0), None, Some(HashMap::from([(SENTINEL_SYMBOL, 13), (65, 7), (67, 9), (71, 11), (84, 12)])), None, None),
                Node::new(Range::new(4, 8, 0), Some(3), None, None, Some(HashSet::from([0]))),
                Node::new(Range::new(4, 8, 0), Some(5), None, None, Some(HashSet::from([0]))),
                Node::new(Range::new(2, 4, 0), Some(7), Some(HashMap::from([(65, 1), (b'G' as Symbol, 4)])), Some(5), None),
                Node::new(Range::new(6, 8, 0), Some(3), None, None, Some(HashSet::from([0]))),
                Node::new(Range::new(2, 4, 0), Some(9), Some(HashMap::from([(65, 2), (b'G' as Symbol, 6)])), Some(7), None),
                Node::new(Range::new(6, 8, 0), Some(5), None, None, Some(HashSet::from([0]))),
                Node::new(Range::new(0, 2, 0), Some(0), Some(HashMap::from([(65, 3), (b'G' as Symbol, 8)])), Some(9), None),
                Node::new(Range::new(6, 8, 0), Some(7), None, None, Some(HashSet::from([0]))),
                Node::new(Range::new(1, 2, 0), Some(0), Some(HashMap::from([(65, 5), (b'G' as Symbol, 10)])), Some(0), None),
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
        let sequences = vec![(11500..12000).map(|i| i as Symbol).collect()];
        let tree = SuffixTree::build(&sequences);
        test_all_substrings(&tree, &sequences);
    }
}

#[cfg(test)]
mod tests_build_multiple_sequences {
    use crate::Symbol;
    use crate::suffixtree::node::{Node, Range};
    use crate::suffixtree::tree::SuffixTree;
    use crate::suffixtree::tree::suffixtree_test_utils::{str_to_symbols, test_all_substrings};
    use crate::suffixtree::types::SENTINEL_SYMBOL;
    use rand::{RngExt, SeedableRng, rngs::StdRng};
    use std::collections::{HashMap, HashSet};

    #[test]
    fn test_two_non_overlapping_sequences() {
        let sequences = vec![str_to_symbols("ABC"), str_to_symbols("DEF")];
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
        let sequences = vec![str_to_symbols("XYAB"), str_to_symbols("XYCD")];
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
        let sequences = vec![str_to_symbols("ABXY"), str_to_symbols("CDXY")];
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
            str_to_symbols("MISSISSIPPI"),
            str_to_symbols("BANANA"),
            str_to_symbols("BANASSIPPI"),
        ];
        let tree = SuffixTree::build(&sequences);
        test_all_substrings(&tree, &sequences);
    }

    #[test]
    fn test_large_random() {
        let mut rng = StdRng::seed_from_u64(42);
        let sequences: Vec<Vec<Symbol>> = (0..50)
            .map(|_| {
                (0..50)
                    .map(|_| (rng.random::<u8>() % 10 + 65) as Symbol)
                    .collect()
            })
            .collect();
        let tree = SuffixTree::build(&sequences);
        test_all_substrings(&tree, &sequences);
    }
}

#[cfg(test)]
mod tests_analysis {
    use crate::Symbol;
    use crate::collections::vec_bitmap::VecBitmap;
    use crate::suffixtree::tree::SuffixTree;
    use crate::suffixtree::tree::suffixtree_test_utils::str_to_symbols;
    use crate::suffixtree::types::AnalysisResult;
    use std::collections::HashSet;

    /// Analyze `inputs` (one symbol per byte), ignoring every symbol that
    /// occurs in `template`.
    fn analyze(inputs: &[&str], template: &[&str], min_match_length: usize) -> AnalysisResult {
        let sequences: Vec<Vec<Symbol>> = inputs.iter().map(|s| str_to_symbols(s)).collect();
        let template: HashSet<Symbol> = template.iter().flat_map(|s| str_to_symbols(s)).collect();

        let lengths: Vec<usize> = sequences.iter().map(Vec::len).collect();
        let mut ignored = VecBitmap::new(&lengths);
        let mut ignores_a_symbol = false;
        for (index, sequence) in sequences.iter().enumerate() {
            for (position, symbol) in sequence.iter().enumerate() {
                if template.contains(symbol) {
                    ignored.item_mut(index).mark(position, 1);
                    ignores_a_symbol = true;
                }
            }
        }

        // A template that ignores no symbol takes the `None` path, like an
        // analysis without a template.
        let mask = ignores_a_symbol.then_some(&ignored);
        SuffixTree::build(&sequences).analyze(&sequences, mask, min_match_length, true)
    }

    /// The stored matches of one pair as `(left_start, right_start, length)`,
    /// sorted so the assertions do not depend on traversal order.
    fn matches(result: &AnalysisResult, i: usize, j: usize) -> Vec<(usize, usize, usize)> {
        let mut found: Vec<(usize, usize, usize)> = result
            .matches
            .as_ref()
            .expect("matches are kept")
            .get(i, j)
            .iter()
            .map(|m| (m.left_start, m.right_start, m.length))
            .collect();
        found.sort_unstable();
        found
    }

    #[test]
    fn identical_sequences_overlap_completely() {
        let result = analyze(&["ABC", "ABC"], &[], 1);

        assert_eq!(matches(&result, 0, 1), vec![(0, 0, 3)]);
        let m = result.metrics.get(0, 1);
        assert_eq!(m.similarity, 1.0);
        assert_eq!(m.longest_match, 3);
        assert_eq!((m.total_left, m.total_right), (3, 3));
        assert_eq!((m.overlap_left, m.overlap_right), (3, 3));
    }

    #[test]
    fn disjoint_sequences_share_nothing() {
        let result = analyze(&["ABC", "DEF"], &[], 1);

        assert!(matches(&result, 0, 1).is_empty());
        let m = result.metrics.get(0, 1);
        assert_eq!(m.similarity, 0.0);
        assert_eq!(m.longest_match, 0);
        assert_eq!((m.overlap_left, m.overlap_right), (0, 0));
    }

    #[test]
    fn a_shared_substring_is_found_at_differing_offsets() {
        let result = analyze(&["ABCDEF", "XYZABC"], &[], 1);

        assert_eq!(matches(&result, 0, 1), vec![(0, 3, 3)]);
        let m = result.metrics.get(0, 1);
        assert_eq!(m.similarity, 0.5);
        assert_eq!(m.longest_match, 3);
        assert_eq!((m.overlap_left, m.overlap_right), (3, 3));
    }

    #[test]
    fn every_pair_is_scored_separately() {
        let result = analyze(&["ABCD", "ABCE", "XYZW"], &[], 1);

        // Only the first two sequences share anything: "ABC".
        assert_eq!(result.metrics.get(0, 1).longest_match, 3);
        assert_eq!(result.metrics.get(0, 1).similarity, 0.75);
        assert_eq!(result.metrics.get(0, 2).similarity, 0.0);
        assert_eq!(result.metrics.get(1, 2).similarity, 0.0);
    }

    #[test]
    fn matches_below_the_minimum_length_are_dropped() {
        let result = analyze(&["ABCDEF", "XYZABC"], &[], 5);

        assert!(matches(&result, 0, 1).is_empty());
        assert_eq!(result.metrics.get(0, 1).longest_match, 0);
    }

    // ── Ignoring ──────────────────────────────────────────────────────

    #[test]
    fn an_ignored_position_splits_a_match_in_two() {
        // "ABXCD" matches at offset 0 in the left sequence and offset 1 in the
        // right one; the ignored X cuts that single raw match into "AB" and
        // "CD", each keeping its own offset in both sequences.
        let result = analyze(&["ABXCD", "QABXCD"], &["X"], 1);

        assert_eq!(matches(&result, 0, 1), vec![(0, 1, 2), (3, 4, 2)]);
        let m = result.metrics.get(0, 1);
        assert_eq!(m.longest_match, 2);
        assert_eq!((m.total_left, m.total_right), (4, 5));
        assert_eq!((m.overlap_left, m.overlap_right), (4, 4));
        assert_eq!(m.similarity, 8.0 / 9.0);
    }

    #[test]
    fn an_ignored_tail_truncates_a_match() {
        let result = analyze(&["ABCD", "ABCD"], &["CD"], 1);

        assert_eq!(matches(&result, 0, 1), vec![(0, 0, 2)]);
        let m = result.metrics.get(0, 1);
        assert_eq!(m.longest_match, 2);
        assert_eq!((m.total_left, m.total_right), (2, 2));
    }

    #[test]
    fn a_core_without_a_node_of_its_own_is_recovered() {
        let result = analyze(&["ABBC", "ABBC"], &["A", "C"], 1);

        assert_eq!(
            matches(&result, 0, 1),
            vec![(1, 1, 2), (1, 2, 1), (2, 1, 1)]
        );
        assert_eq!(result.metrics.get(0, 1).longest_match, 2);
    }

    #[test]
    fn the_minimum_length_applies_per_run() {
        let result = analyze(&["ABXBC", "ABXBC"], &["X"], 3);

        assert!(matches(&result, 0, 1).is_empty());
        let m = result.metrics.get(0, 1);
        assert_eq!(m.similarity, 0.0);
        assert_eq!((m.total_left, m.total_right), (4, 4));
        assert_eq!((m.overlap_left, m.overlap_right), (0, 0));
    }

    #[test]
    fn fully_ignored_sequences_have_no_similarity() {
        // Both denominators collapse to zero.
        let result = analyze(&["XX", "X"], &["X"], 1);

        assert!(matches(&result, 0, 1).is_empty());
        let m = result.metrics.get(0, 1);
        assert_eq!(m.similarity, 0.0);
        assert_eq!((m.total_left, m.total_right), (0, 0));
    }
}
