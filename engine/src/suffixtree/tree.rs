use crate::suffixtree::node::{Node, NodeType};
use crate::suffixtree::tree_builder::TreeBuilder;

#[derive(Debug, PartialEq)]
pub struct Tree {
    pub arena: Vec<Node>,
}

impl Tree {
    pub fn new() -> Self {
        Tree {
            arena: vec![Node::create_root()],
        }
    }

    pub fn add_words(&mut self, data: &[Vec<NodeType>], tree_builder: impl TreeBuilder) {
        tree_builder.add_words(data, self);
    }

    pub fn print(&self) {
        self.arena[0].print(0, &self.arena);
    }
}

#[cfg(test)]
mod tests_single_input {
    use crate::suffixtree::node::{Node, NodeIndex, NodeType, Nullable, Range};
    use crate::suffixtree::searcher::Searcher;
    use crate::suffixtree::tree::Tree;
    use crate::suffixtree::tree_builder::{TreeBuilder, UkkonenBuilder};
    use std::collections::{HashMap, HashSet};

    pub fn str_to_nodes(s: &str) -> Vec<NodeType> {
        s.as_bytes().iter().map(|&b| b as NodeType).collect()
    }

    #[test]
    fn test_large_alphabet() {
        let mut vec1 = vec![];

        for i in 1..50 {
            vec1.push(i as NodeType);
        }
        let input = vec![vec1];
        let mut tree = Tree::new();
        tree.add_words(&input, UkkonenBuilder::new());
        let mut searcher = Searcher::new(&tree, &input);

        for i in 0..26 {
            assert!(searcher.search_if_match(&input[0][i..i + 1]));
            assert!(searcher.search_if_match(&input[0][i..]));
        }
    }

    #[test]
    fn small_test() {
        let input = vec![str_to_nodes("ABCD$")];
        let mut tree = Tree::new();
        tree.add_words(&input, UkkonenBuilder::new());

        let control_tree = Tree {
            arena: vec![
                Node::new(Range::new(0,0,0), NodeIndex::NULL, HashMap::from([(65, 1),(66, 2),(67, 3),(68, 4),(36, 5)]), NodeIndex::NULL, HashSet::new()),
                Node::new(Range::new(0,5,0), 0, HashMap::new(), NodeIndex::NULL, HashSet::from([0])),
                Node::new(Range::new(1,5,0), 0, HashMap::new(), NodeIndex::NULL, HashSet::from([0])),
                Node::new(Range::new(2,5,0), 0, HashMap::new(), NodeIndex::NULL, HashSet::from([0])),
                Node::new(Range::new(3,5,0), 0, HashMap::new(), NodeIndex::NULL, HashSet::from([0])),
                Node::new(Range::new(4,5,0), 0, HashMap::new(), NodeIndex::NULL, HashSet::from([0])),
            ]
        };

        assert_eq!(tree, control_tree);
    }



    #[test]
    fn test_single_word() {
        let input = vec![str_to_nodes("ACACACGT$")];

        let mut tree = Tree::new();
        tree.add_words(&input, UkkonenBuilder::new());

        let control_tree = Tree {
            arena: vec![
                Node::new(Range::new(0, 0, 0), NodeIndex::NULL, HashMap::from([(36, 13), (65, 7), (67, 9), (b'G' as NodeType, 11), (b'T' as NodeType, 12)]), NodeIndex::NULL, HashSet::new()),
                Node::new(Range::new(4, 9, 0), 3, HashMap::new(), NodeIndex::NULL, HashSet::from([0])),
                Node::new(Range::new(4, 9, 0), 5, HashMap::new(), NodeIndex::NULL, HashSet::from([0])),
                Node::new(Range::new(2, 4, 0), 7, HashMap::from([(65, 1), (b'G' as NodeType, 4)]), 5, HashSet::new()),
                Node::new(Range::new(6, 9, 0), 3, HashMap::new(), NodeIndex::NULL, HashSet::from([0])),
                Node::new(Range::new(2, 4, 0), 9, HashMap::from([(65, 2), (b'G' as NodeType, 6)]), 7, HashSet::new()),
                Node::new(Range::new(6, 9, 0), 5, HashMap::new(), NodeIndex::NULL, HashSet::from([0])),
                Node::new(Range::new(0, 2, 0), 0, HashMap::from([(65, 3), (b'G' as NodeType, 8)]), 9, HashSet::new()),
                Node::new(Range::new(6, 9, 0), 7, HashMap::new(), NodeIndex::NULL, HashSet::from([0])),
                Node::new(Range::new(1, 2, 0), 0, HashMap::from([(65, 5), (b'G' as NodeType, 10)]), 0, HashSet::new()),
                Node::new(Range::new(6, 9, 0), 9, HashMap::new(), NodeIndex::NULL, HashSet::from([0])),
                Node::new(Range::new(6, 9, 0), 0, HashMap::new(), NodeIndex::NULL, HashSet::from([0])),
                Node::new(Range::new(7, 9, 0), 0, HashMap::new(), NodeIndex::NULL, HashSet::from([0])),
                Node::new(Range::new(8, 9, 0), 0, HashMap::new(), NodeIndex::NULL, HashSet::from([0])),
            ]
        };

        assert_eq!(tree, control_tree);
    }
}

mod tests_multiple_inputs {
    use crate::suffixtree::node::{Node, NodeIndex, NodeType, Nullable, Range};
    use crate::suffixtree::searcher::Searcher;
    use crate::suffixtree::tree::Tree;
    use crate::suffixtree::tree_builder::{TreeBuilder, UkkonenBuilder};
    use std::collections::{HashMap, HashSet};

    pub fn str_to_nodes(s: &str) -> Vec<NodeType> {
        s.as_bytes().iter().map(|&b| b as NodeType).collect()
    }

    fn test_all_substrings(inputs: &[Vec<NodeType>], searcher: &mut Searcher) {
        for (i, word) in inputs.iter().enumerate() {
            for start in 0..word.len() {
                for end in start +1..=word.len() {
                    assert!(searcher.search_if_match(&word[start..end]));
                    let vec = searcher.find_all_suffix_indices(&word[start..end]);
                    assert!(vec.contains(&i));

                }
            }
        }
    }

    #[test]
    fn test_two_non_overlapping_inputs() {
        let input = vec![
            str_to_nodes("ABC$"), 
            str_to_nodes("DEF$")
        ];

        let mut tree = Tree::new();
        tree.add_words(&input, UkkonenBuilder::new());

        let control_tree = Tree {
            arena: vec![
                Node::new(Range::new(0,0,0), NodeIndex::NULL, HashMap::from([(65, 1),(66, 2),(67, 3),(68, 5),(69, 6),(70, 7),(36, 4)]), NodeIndex::NULL, HashSet::new()),
                Node::new(Range::new(0,4,0), 0, HashMap::new(), NodeIndex::NULL, HashSet::from([0])),
                Node::new(Range::new(1,4,0), 0, HashMap::new(), NodeIndex::NULL, HashSet::from([0])),
                Node::new(Range::new(2,4,0), 0, HashMap::new(), NodeIndex::NULL, HashSet::from([0])),
                Node::new(Range::new(3,4,0), 0, HashMap::new(), NodeIndex::NULL, HashSet::from([0, 1])),
                Node::new(Range::new(0,4,1), 0, HashMap::new(), NodeIndex::NULL, HashSet::from([1])),
                Node::new(Range::new(1,4,1), 0, HashMap::new(), NodeIndex::NULL, HashSet::from([1])),
                Node::new(Range::new(2,4,1), 0, HashMap::new(), NodeIndex::NULL, HashSet::from([1])),
            ]
        };

        assert_eq!(tree, control_tree);
    }

    #[test]
    fn test_two_overlapping_begin_inputs() {
        let input = vec![
            str_to_nodes("XYAB$"), 
            str_to_nodes("XYCD$")
        ];

        let mut tree = Tree::new();
        tree.add_words(&input, UkkonenBuilder::new());

        let control_tree = Tree {
            arena: vec![
                Node::new(Range::new(0, 0, 0), NodeIndex::NULL, HashMap::from([(65, 3),(66, 4),(67, 10),(68, 11),(88, 6),(89, 8),(36, 5)]), NodeIndex::NULL, HashSet::new()),
                Node::new(Range::new(2, 5, 0), 6, HashMap::new(), NodeIndex::NULL, HashSet::from([0])),
                Node::new(Range::new(2, 5, 0), 8, HashMap::new(), NodeIndex::NULL, HashSet::from([0])),
                Node::new(Range::new(2, 5, 0), 0, HashMap::new(), NodeIndex::NULL, HashSet::from([0])),
                Node::new(Range::new(3, 5, 0), 0, HashMap::new(), NodeIndex::NULL, HashSet::from([0])),
                Node::new(Range::new(4, 5, 0), 0, HashMap::new(), NodeIndex::NULL, HashSet::from([0, 1])),
                Node::new(Range::new(0, 2, 0), 0, HashMap::from([(65, 1),(67, 7)]), 8, HashSet::new()),
                Node::new(Range::new(2, 5, 1), 6, HashMap::new(), NodeIndex::NULL, HashSet::from([1])),
                Node::new(Range::new(1, 2, 0), 0, HashMap::from([(65, 2),(67, 9)]), 0, HashSet::new()),
                Node::new(Range::new(2, 5, 1), 8, HashMap::new(), NodeIndex::NULL, HashSet::from([1])),
                Node::new(Range::new(2, 5, 1), 0, HashMap::new(), NodeIndex::NULL, HashSet::from([1])),
                Node::new(Range::new(3, 5, 1), 0, HashMap::new(), NodeIndex::NULL, HashSet::from([1]))
            ]
        };

        assert_eq!(tree, control_tree);
    }

    #[test]
    fn test_two_overlapping_end_inputs() {
        let input = vec![
            str_to_nodes("ABXY$"), 
            str_to_nodes("CDXY$")
        ];

        let mut tree = Tree::new();
        tree.add_words(&input, UkkonenBuilder::new());

        let control_tree = Tree {
            arena: vec![
                Node::new(Range::new(0,0,0), NodeIndex::NULL, HashMap::from([(65, 1),(66, 2),(67, 6),(68, 7),(88, 3),(89, 4),(36, 5)]), NodeIndex::NULL, HashSet::new()),
                Node::new(Range::new(0,5,0), 0, HashMap::new(), NodeIndex::NULL, HashSet::from([0])),
                Node::new(Range::new(1,5,0), 0, HashMap::new(), NodeIndex::NULL, HashSet::from([0])),
                Node::new(Range::new(2,5,0), 0, HashMap::new(), NodeIndex::NULL, HashSet::from([0, 1])),
                Node::new(Range::new(3,5,0), 0, HashMap::new(), NodeIndex::NULL, HashSet::from([0, 1])),
                Node::new(Range::new(4,5,0), 0, HashMap::new(), NodeIndex::NULL, HashSet::from([0, 1])),
                Node::new(Range::new(0,5,1), 0, HashMap::new(), NodeIndex::NULL, HashSet::from([1])),
                Node::new(Range::new(1,5,1), 0, HashMap::new(), NodeIndex::NULL, HashSet::from([1])),
            ]
        };

        assert_eq!(tree, control_tree);
    }

    #[test]
    fn test_multiple_inputs() {
        let input = vec![
            str_to_nodes("MISSISSIPPI$"), 
            str_to_nodes("BANANA$"), 
            str_to_nodes("BANASSIPPI$")
        ];

        let mut tree = Tree::new();
        tree.add_words(&input, UkkonenBuilder::new());

        let mut s = Searcher::new(&tree, &input);
        test_all_substrings(&input, &mut s);
    }

    #[test]
    fn test_large_random() {
        let mut input: Vec<Vec<NodeType>> = vec![];

        for _ in 0..50 {
            let mut vec: Vec<NodeType> = vec![];
            for _ in 0..50 {
                vec.push((rand::random::<u8>() % 10 + 65) as NodeType);
            }
            vec.push(36);
            input.push(vec);
        }

        let mut tree = Tree::new();
        tree.add_words(&input, UkkonenBuilder::new());

        let mut s = Searcher::new(&tree, &input);
        test_all_substrings(&input, &mut s);
    }
}