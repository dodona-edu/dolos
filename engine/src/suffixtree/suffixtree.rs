use crate::report::AnalysisResult;
use crate::suffixtree::maximal_match::MaximalMatchAnalyzer;
use crate::suffixtree::node::Node;
use crate::suffixtree::tree_builder::UkkonenBuilder;
use crate::suffixtree::types::SymbolType;

/// A generalized suffix tree implementation.
#[derive(Debug, PartialEq)]
pub struct SuffixTree {
    /// Arena containing all nodes in the tree. The root is always at index 0.
    pub(crate) arena: Vec<Node>,
}

impl SuffixTree {
    /// Creates a new `SuffixTree` from the given words, building it immediately.
    pub(crate) fn new(words: &[Vec<SymbolType>]) -> Self {
        let mut tree = SuffixTree {
            arena: vec![Node::create_root()],
        };
        UkkonenBuilder::new().add_words(words, &mut tree);
        tree
    }

    /// Run maximal-match analysis on this suffix tree, returning pairwise
    /// similarity and longest-fragment results.
    pub(crate) fn analyze(
        &self,
        words: &[Vec<SymbolType>],
        min_match_length: usize,
    ) -> AnalysisResult {
        MaximalMatchAnalyzer::new(self, words, min_match_length).analyze()
    }
}

#[cfg(test)]
pub mod suffixtree_test_utils {
    use crate::suffixtree::suffixtree::SuffixTree;
    use crate::suffixtree::types::SymbolType;

    pub fn str_to_nodes(s: &str) -> Vec<SymbolType> {
        s.as_bytes().iter().map(|&b| b as SymbolType).collect()
    }

    fn search_pattern(
        tree: &SuffixTree,
        words: &[Vec<SymbolType>],
        search_word: &[SymbolType],
    ) -> Option<usize> {
        if search_word.is_empty() {
            return Some(0);
        }

        let (mut node_index, mut edge_offset) = (0, 0);
        for &symbol in search_word {
            let node = &tree.arena[node_index];
            if edge_offset < node.range.length() {
                if words[node.range.word][node.range.start + edge_offset] != symbol {
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
        words: &[Vec<SymbolType>],
        search_words: &[SymbolType],
    ) -> bool {
        search_pattern(tree, words, search_words).is_some()
    }

    pub fn tree_all_suffix_indices(
        tree: &SuffixTree,
        words: &[Vec<SymbolType>],
        search_word: &[SymbolType],
    ) -> Vec<usize> {
        let Some(end_node) = search_pattern(tree, words, search_word) else {
            return vec![];
        };

        let mut suffix_indices_list = Vec::new();
        let mut stack = vec![end_node];
        while let Some(current) = stack.pop() {
            let node = &tree.arena[current];
            match (&node.word_indices, &node.children) {
                (Some(word_indices), _) => suffix_indices_list.extend(word_indices.iter().copied()),
                (None, Some(children)) => stack.extend(children.values().copied()),
                (None, None) => unreachable!("Node must have either word indices or children"),
            }
        }

        suffix_indices_list
    }

    pub fn test_all_substrings(tree: &SuffixTree, words: &[Vec<SymbolType>]) {
        for (i, word) in words.iter().enumerate() {
            for start in 0..word.len() {
                for end in start + 1..=word.len() {
                    assert!(tree_contains(tree, words, &word[start..end]));
                    let vec = tree_all_suffix_indices(tree, words, &word[start..end]);
                    assert!(vec.contains(&i));
                }
            }
        }
    }
}

#[cfg(test)]
mod tests_single_word {
    use crate::suffixtree::node::{Node, Range};
    use crate::suffixtree::suffixtree::SuffixTree;
    use crate::suffixtree::suffixtree::suffixtree_test_utils::{str_to_nodes, test_all_substrings};
    use crate::suffixtree::types::{SENTINEL_SYMBOL, SymbolType};
    use std::collections::{HashMap, HashSet};

    #[test]
    fn small_test() {
        let words = vec![str_to_nodes("ABCD")];
        let tree = SuffixTree::new(&words);
        let control_tree = SuffixTree {
            arena: vec![
                Node::new(
                    Range::new(0, 0, 0),
                    None,
                    Some(HashMap::from([
                        (65, 1),
                        (66, 2),
                        (67, 3),
                        (68, 4),
                        (SENTINEL_SYMBOL, 5),
                    ])),
                    None,
                    None,
                ),
                Node::new(
                    Range::new(0, 4, 0),
                    Some(0),
                    None,
                    None,
                    Some(HashSet::from([0])),
                ),
                Node::new(
                    Range::new(1, 4, 0),
                    Some(0),
                    None,
                    None,
                    Some(HashSet::from([0])),
                ),
                Node::new(
                    Range::new(2, 4, 0),
                    Some(0),
                    None,
                    None,
                    Some(HashSet::from([0])),
                ),
                Node::new(
                    Range::new(3, 4, 0),
                    Some(0),
                    None,
                    None,
                    Some(HashSet::from([0])),
                ),
                Node::new(
                    Range::new(4, 4, 0),
                    Some(0),
                    None,
                    None,
                    Some(HashSet::from([0])),
                ),
            ],
        };
        assert_eq!(tree, control_tree);
    }

    #[test]
    fn test_single_word() {
        let words = vec![str_to_nodes("ACACACGT")];
        let tree = SuffixTree::new(&words);
        let control_tree = SuffixTree {
            arena: vec![
                Node::new(
                    Range::new(0, 0, 0),
                    None,
                    Some(HashMap::from([
                        (SENTINEL_SYMBOL, 13),
                        (65, 7),
                        (67, 9),
                        (71, 11),
                        (84, 12),
                    ])),
                    None,
                    None,
                ),
                Node::new(
                    Range::new(4, 8, 0),
                    Some(3),
                    None,
                    None,
                    Some(HashSet::from([0])),
                ),
                Node::new(
                    Range::new(4, 8, 0),
                    Some(5),
                    None,
                    None,
                    Some(HashSet::from([0])),
                ),
                Node::new(
                    Range::new(2, 4, 0),
                    Some(7),
                    Some(HashMap::from([(65, 1), (b'G' as SymbolType, 4)])),
                    Some(5),
                    None,
                ),
                Node::new(
                    Range::new(6, 8, 0),
                    Some(3),
                    None,
                    None,
                    Some(HashSet::from([0])),
                ),
                Node::new(
                    Range::new(2, 4, 0),
                    Some(9),
                    Some(HashMap::from([(65, 2), (b'G' as SymbolType, 6)])),
                    Some(7),
                    None,
                ),
                Node::new(
                    Range::new(6, 8, 0),
                    Some(5),
                    None,
                    None,
                    Some(HashSet::from([0])),
                ),
                Node::new(
                    Range::new(0, 2, 0),
                    Some(0),
                    Some(HashMap::from([(65, 3), (b'G' as SymbolType, 8)])),
                    Some(9),
                    None,
                ),
                Node::new(
                    Range::new(6, 8, 0),
                    Some(7),
                    None,
                    None,
                    Some(HashSet::from([0])),
                ),
                Node::new(
                    Range::new(1, 2, 0),
                    Some(0),
                    Some(HashMap::from([(65, 5), (b'G' as SymbolType, 10)])),
                    Some(0),
                    None,
                ),
                Node::new(
                    Range::new(6, 8, 0),
                    Some(9),
                    None,
                    None,
                    Some(HashSet::from([0])),
                ),
                Node::new(
                    Range::new(6, 8, 0),
                    Some(0),
                    None,
                    None,
                    Some(HashSet::from([0])),
                ),
                Node::new(
                    Range::new(7, 8, 0),
                    Some(0),
                    None,
                    None,
                    Some(HashSet::from([0])),
                ),
                Node::new(
                    Range::new(8, 8, 0),
                    Some(0),
                    None,
                    None,
                    Some(HashSet::from([0])),
                ),
            ],
        };
        assert_eq!(tree, control_tree);
    }

    #[test]
    fn test_large_alphabet() {
        let mut vec1 = vec![];

        for i in 11500..12000 {
            vec1.push(i as SymbolType);
        }
        let words = vec![vec1];
        let tree = SuffixTree::new(&words);

        test_all_substrings(&tree, &words);
    }
}

#[cfg(test)]
mod tests_multiple_words {
    use crate::suffixtree::node::{Node, Range};
    use crate::suffixtree::suffixtree::SuffixTree;
    use crate::suffixtree::suffixtree::suffixtree_test_utils::{str_to_nodes, test_all_substrings};
    use crate::suffixtree::types::{SENTINEL_SYMBOL, SymbolType};
    use rand::{RngExt, SeedableRng, rngs::StdRng};
    use std::collections::{HashMap, HashSet};

    #[test]
    fn test_two_non_overlapping_words() {
        let words = vec![str_to_nodes("ABC"), str_to_nodes("DEF")];
        let tree = SuffixTree::new(&words);
        let control_tree = SuffixTree {
            arena: vec![
                Node::new(
                    Range::new(0, 0, 0),
                    None,
                    Some(HashMap::from([
                        (65, 1),
                        (66, 2),
                        (67, 3),
                        (68, 5),
                        (69, 6),
                        (70, 7),
                        (SENTINEL_SYMBOL, 4),
                    ])),
                    None,
                    None,
                ),
                Node::new(
                    Range::new(0, 3, 0),
                    Some(0),
                    None,
                    None,
                    Some(HashSet::from([0])),
                ),
                Node::new(
                    Range::new(1, 3, 0),
                    Some(0),
                    None,
                    None,
                    Some(HashSet::from([0])),
                ),
                Node::new(
                    Range::new(2, 3, 0),
                    Some(0),
                    None,
                    None,
                    Some(HashSet::from([0])),
                ),
                Node::new(
                    Range::new(3, 3, 0),
                    Some(0),
                    None,
                    None,
                    Some(HashSet::from([0, 1])),
                ),
                Node::new(
                    Range::new(0, 3, 1),
                    Some(0),
                    None,
                    None,
                    Some(HashSet::from([1])),
                ),
                Node::new(
                    Range::new(1, 3, 1),
                    Some(0),
                    None,
                    None,
                    Some(HashSet::from([1])),
                ),
                Node::new(
                    Range::new(2, 3, 1),
                    Some(0),
                    None,
                    None,
                    Some(HashSet::from([1])),
                ),
            ],
        };
        assert_eq!(tree, control_tree);
    }

    #[test]
    fn test_two_overlapping_begin_words() {
        let words = vec![str_to_nodes("XYAB"), str_to_nodes("XYCD")];
        let tree = SuffixTree::new(&words);
        let control_tree = SuffixTree {
            arena: vec![
                Node::new(
                    Range::new(0, 0, 0),
                    None,
                    Some(HashMap::from([
                        (65, 3),
                        (66, 4),
                        (67, 10),
                        (68, 11),
                        (88, 6),
                        (89, 8),
                        (SENTINEL_SYMBOL, 5),
                    ])),
                    None,
                    None,
                ),
                Node::new(
                    Range::new(2, 4, 0),
                    Some(6),
                    None,
                    None,
                    Some(HashSet::from([0])),
                ),
                Node::new(
                    Range::new(2, 4, 0),
                    Some(8),
                    None,
                    None,
                    Some(HashSet::from([0])),
                ),
                Node::new(
                    Range::new(2, 4, 0),
                    Some(0),
                    None,
                    None,
                    Some(HashSet::from([0])),
                ),
                Node::new(
                    Range::new(3, 4, 0),
                    Some(0),
                    None,
                    None,
                    Some(HashSet::from([0])),
                ),
                Node::new(
                    Range::new(4, 4, 0),
                    Some(0),
                    None,
                    None,
                    Some(HashSet::from([0, 1])),
                ),
                Node::new(
                    Range::new(0, 2, 0),
                    Some(0),
                    Some(HashMap::from([(65, 1), (67, 7)])),
                    Some(8),
                    None,
                ),
                Node::new(
                    Range::new(2, 4, 1),
                    Some(6),
                    None,
                    None,
                    Some(HashSet::from([1])),
                ),
                Node::new(
                    Range::new(1, 2, 0),
                    Some(0),
                    Some(HashMap::from([(65, 2), (67, 9)])),
                    Some(0),
                    None,
                ),
                Node::new(
                    Range::new(2, 4, 1),
                    Some(8),
                    None,
                    None,
                    Some(HashSet::from([1])),
                ),
                Node::new(
                    Range::new(2, 4, 1),
                    Some(0),
                    None,
                    None,
                    Some(HashSet::from([1])),
                ),
                Node::new(
                    Range::new(3, 4, 1),
                    Some(0),
                    None,
                    None,
                    Some(HashSet::from([1])),
                ),
            ],
        };
        assert_eq!(tree, control_tree);
    }

    #[test]
    fn test_two_overlapping_end_words() {
        let words = vec![str_to_nodes("ABXY"), str_to_nodes("CDXY")];
        let tree = SuffixTree::new(&words);
        let control_tree = SuffixTree {
            arena: vec![
                Node::new(
                    Range::new(0, 0, 0),
                    None,
                    Some(HashMap::from([
                        (65, 1),
                        (66, 2),
                        (67, 6),
                        (68, 7),
                        (88, 3),
                        (89, 4),
                        (SENTINEL_SYMBOL, 5),
                    ])),
                    None,
                    None,
                ),
                Node::new(
                    Range::new(0, 4, 0),
                    Some(0),
                    None,
                    None,
                    Some(HashSet::from([0])),
                ),
                Node::new(
                    Range::new(1, 4, 0),
                    Some(0),
                    None,
                    None,
                    Some(HashSet::from([0])),
                ),
                Node::new(
                    Range::new(2, 4, 0),
                    Some(0),
                    None,
                    None,
                    Some(HashSet::from([0, 1])),
                ),
                Node::new(
                    Range::new(3, 4, 0),
                    Some(0),
                    None,
                    None,
                    Some(HashSet::from([0, 1])),
                ),
                Node::new(
                    Range::new(4, 4, 0),
                    Some(0),
                    None,
                    None,
                    Some(HashSet::from([0, 1])),
                ),
                Node::new(
                    Range::new(0, 4, 1),
                    Some(0),
                    None,
                    None,
                    Some(HashSet::from([1])),
                ),
                Node::new(
                    Range::new(1, 4, 1),
                    Some(0),
                    None,
                    None,
                    Some(HashSet::from([1])),
                ),
            ],
        };
        assert_eq!(tree, control_tree);
    }

    #[test]
    fn test_multiple_words() {
        let words = vec![
            str_to_nodes("MISSISSIPPI"),
            str_to_nodes("BANANA"),
            str_to_nodes("BANASSIPPI"),
        ];

        let tree = SuffixTree::new(&words);
        test_all_substrings(&tree, &words);
    }

    #[test]
    fn test_large_random() {
        let mut rng = StdRng::seed_from_u64(42);
        let mut words: Vec<Vec<SymbolType>> = vec![];

        for _ in 0..50 {
            let mut vec: Vec<SymbolType> = vec![];
            for _ in 0..50 {
                vec.push((rng.random::<u8>() % 10 + 65) as SymbolType);
            }
            words.push(vec);
        }

        let tree = SuffixTree::new(&words);
        test_all_substrings(&tree, &words);
    }
}
