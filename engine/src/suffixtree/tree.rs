use crate::suffixtree::tree_builder::TreeBuilder;
use std::collections::{HashMap, HashSet};

/// Custom trait implemented by types that have a value that represents NULL
pub trait Nullable<T> {
    const NULL: T;

    fn is_null(&self) -> bool;
}

/// Type that represents the index of a node in the arena part of the tree
pub type NodeIndex = usize;

impl Nullable<NodeIndex> for NodeIndex {
    /// Use usize::MAX as NULL value since this will in practice never be reached.
    /// It is not possible to create 2^64-1 nodes (on a 64-bit machine). 
    /// This would simply never fit in memory
    const NULL: NodeIndex = usize::MAX;

    fn is_null(&self) -> bool {
        *self == Self::NULL
    }
}


#[derive(Debug, PartialEq)]
pub struct Tree {
    pub arena: Vec<Node>,
}

impl Tree {
    pub fn new(data: &[&[u8]], builder: impl TreeBuilder) -> Self {
        builder.build(
            data,
            Tree {
                arena: vec![Node::create_root()],
            },
        )
    }

    pub fn print(&self) {
        self.arena[0].print(0, &self.arena);
    }
}

#[derive(Debug, PartialEq)]
pub struct Node {
    pub range: Range,
    pub children: HashMap<u8, NodeIndex>,
    pub parent: NodeIndex,
    pub link: NodeIndex,
    pub inputs: HashSet<usize>,
}

impl Node {
    pub fn create_root() -> Self {
        Node {
            range: Range::new(0, 0, 0),
            children: HashMap::new(),
            parent: NodeIndex::NULL,
            link: NodeIndex::NULL,
            inputs: HashSet::new(),
        }
    }

    /// Returns a tuple that contains the index of the new node in the arena and a reference to that node
    pub fn new(range: Range, parent: NodeIndex, children: HashMap<u8, NodeIndex>, link: NodeIndex, inputs: HashSet<usize>) -> Node {
        Node {
            range,
            children,
            parent,
            link,
            inputs,
        }
    }

    pub fn new_with_child_tuples(range: Range, parent: NodeIndex, children_tuples: Vec<(u8, NodeIndex)>, link: NodeIndex, inputs: HashSet<usize>) -> Node {
        let mut node = Node {
            range,
            children: HashMap::new(),
            parent,
            link,
            inputs,
        };
        children_tuples.iter().for_each(|(char, child)| node.add_child(*char, *child));
        node
    }

    pub fn add_child(&mut self, character: u8, child: NodeIndex) {
        self.children.insert(character, child);
    }

    pub fn get_child(&self, character: u8) -> NodeIndex {
        self.children.get(&character).copied().unwrap_or(NodeIndex::NULL)
    }

    pub fn set_new_children(&mut self, new_children: Vec<(u8, NodeIndex)>) {
        self.children = HashMap::new();
        new_children.iter().for_each(|(character, child)| self.add_child(*character, *child));
    }

    pub fn print(&self, depth: i32, arena: &Vec<Node>) {
        // Print node fields
        println!(
            "Node {{ range: {:?}, parent: {}, link: {}, inputs: {:?}, children: {} }}",
            self.range,
            self.parent,
            self.link,
            self.inputs,
            self.children.len()
        );

        // Recursively print all children
        for (char, &child_index) in &self.children {
            print!("{}", " ".repeat(((depth + 1) * 4) as usize));
            print!("'{}' ->", *char as char);
            arena[child_index].print(depth + 1, arena);
        }
    }
}

#[derive(Debug, PartialEq)]
pub struct Range {
    pub start: usize,
    pub end: usize,
    pub input: usize,
}

impl Range {
    pub fn new(start: usize, end: usize, input: usize) -> Self {
        Range { start, end, input }
    }
    pub fn length(&self) -> usize {
        self.end - self.start
    }
}

#[cfg(test)]
mod tests_single_input {
    use crate::suffixtree::searcher::Searcher;
    use crate::suffixtree::tree::{Node, NodeIndex, Nullable, Range, Tree};
    use crate::suffixtree::tree_builder::{TreeBuilder, UkkonenBuilder};
    use std::collections::{HashMap, HashSet};

    #[test]
    fn test_large_alphabet() {
        let mut vec1 = vec![];

        for i in 1..50 {
            vec1.push(i as u8);
        }
        let input: Vec<&[u8]> = vec![&vec1];
        let tree = Tree::new(&input, UkkonenBuilder::new());
        let mut searcher = Searcher::new(&tree, &input);

        for i in 0..26 {
            assert!(searcher.search_if_match(&vec1[i..i + 1]));
            assert!(searcher.search_if_match(&vec1[i..]));
        }
    }

    #[test]
    fn small_test() {
        let vec1 = "ABCD$".as_bytes();
        let input = vec![vec1];
        let tree = Tree::new(&input, UkkonenBuilder::new());

        let control_tree = Tree {
            arena: vec![
                Node::new(Range::new(0,0,0), NodeIndex::NULL, HashMap::from([(b'A', 1),(b'B', 2),(b'C', 3),(b'D', 4),(b'$', 5)]), NodeIndex::NULL, HashSet::new()),
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
        let vec1 = "ACACACGT$".as_bytes();
        let input = vec![vec1];

        let tree = Tree::new(&input, UkkonenBuilder::new());

        let control_tree = Tree {
            arena: vec![
                Node::new(Range::new(0, 0, 0), NodeIndex::NULL, HashMap::from([(b'$', 13), (b'A', 7), (b'C', 9), (b'G', 11), (b'T', 12)]), NodeIndex::NULL, HashSet::new()),
                Node::new(Range::new(4, 9, 0), 3, HashMap::new(), NodeIndex::NULL, HashSet::from([0])),
                Node::new(Range::new(4, 9, 0), 5, HashMap::new(), NodeIndex::NULL, HashSet::from([0])),
                Node::new(Range::new(2, 4, 0), 7, HashMap::from([(b'A', 1), (b'G', 4)]), 5, HashSet::new()),
                Node::new(Range::new(6, 9, 0), 3, HashMap::new(), NodeIndex::NULL, HashSet::from([0])),
                Node::new(Range::new(2, 4, 0), 9, HashMap::from([(b'A', 2), (b'G', 6)]), 7, HashSet::new()),
                Node::new(Range::new(6, 9, 0), 5, HashMap::new(), NodeIndex::NULL, HashSet::from([0])),
                Node::new(Range::new(0, 2, 0), 0, HashMap::from([(b'A', 3), (b'G', 8)]), 9, HashSet::new()),
                Node::new(Range::new(6, 9, 0), 7, HashMap::new(), NodeIndex::NULL, HashSet::from([0])),
                Node::new(Range::new(1, 2, 0), 0, HashMap::from([(b'A', 5), (b'G', 10)]), 0, HashSet::new()),
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
    use crate::suffixtree::searcher::Searcher;
    use crate::suffixtree::tree::{Node, NodeIndex, Nullable, Range, Tree};
    use crate::suffixtree::tree_builder::{TreeBuilder, UkkonenBuilder};
    use std::collections::{HashMap, HashSet};

    fn test_all_substrings(inputs: &[&[u8]], searcher: &mut Searcher) {
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
        let vec1 = "ABC$".as_bytes();
        let vec2 = "DEF$".as_bytes();
        let input = vec![vec1, vec2];
        let tree = Tree::new(&input, UkkonenBuilder::new());

        let control_tree = Tree {
            arena: vec![
                Node::new(Range::new(0,0,0), NodeIndex::NULL, HashMap::from([(b'A', 1),(b'B', 2),(b'C', 3),(b'D', 5),(b'E', 6),(b'F', 7),(b'$', 4)]), NodeIndex::NULL, HashSet::new()),
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
        let vec1 = "XYAB$".as_bytes();
        let vec2 = "XYCD$".as_bytes();
        let input = vec![vec1, vec2];
        let tree = Tree::new(&input, UkkonenBuilder::new());

        let control_tree = Tree {
            arena: vec![
                Node::new(Range::new(0, 0, 0), NodeIndex::NULL, HashMap::from([(b'A', 3),(b'B', 4),(b'C', 10),(b'D', 11),(b'X', 6),(b'Y', 8),(b'$', 5)]), NodeIndex::NULL, HashSet::new()),
                Node::new(Range::new(2, 5, 0), 6, HashMap::new(), NodeIndex::NULL, HashSet::from([0])),
                Node::new(Range::new(2, 5, 0), 8, HashMap::new(), NodeIndex::NULL, HashSet::from([0])),
                Node::new(Range::new(2, 5, 0), 0, HashMap::new(), NodeIndex::NULL, HashSet::from([0])),
                Node::new(Range::new(3, 5, 0), 0, HashMap::new(), NodeIndex::NULL, HashSet::from([0])),
                Node::new(Range::new(4, 5, 0), 0, HashMap::new(), NodeIndex::NULL, HashSet::from([0, 1])),
                Node::new(Range::new(0, 2, 0), 0, HashMap::from([(b'A', 1),(b'C', 7)]), 8, HashSet::new()),
                Node::new(Range::new(2, 5, 1), 6, HashMap::new(), NodeIndex::NULL, HashSet::from([1])),
                Node::new(Range::new(1, 2, 0), 0, HashMap::from([(b'A', 2),(b'C', 9)]), 0, HashSet::new()),
                Node::new(Range::new(2, 5, 1), 8, HashMap::new(), NodeIndex::NULL, HashSet::from([1])),
                Node::new(Range::new(2, 5, 1), 0, HashMap::new(), NodeIndex::NULL, HashSet::from([1])),
                Node::new(Range::new(3, 5, 1), 0, HashMap::new(), NodeIndex::NULL, HashSet::from([1]))
            ]
        };

        assert_eq!(tree, control_tree);
    }

    #[test]
    fn test_two_overlapping_end_inputs() {
        let vec1 = "ABXY$".as_bytes();
        let vec2 = "CDXY$".as_bytes();
        let input = vec![vec1, vec2];
        let tree = Tree::new(&input, UkkonenBuilder::new());

        let control_tree = Tree {
            arena: vec![
                Node::new(Range::new(0,0,0), NodeIndex::NULL, HashMap::from([(b'A', 1),(b'B', 2),(b'C', 6),(b'D', 7),(b'X', 3),(b'Y', 4),(b'$', 5)]), NodeIndex::NULL, HashSet::new()),
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
        let vec1 = "MISSISSIPPI$".as_bytes();
        let vec2 = "BANANA$".as_bytes();
        let vec3 = "BANASSIPPI$".as_bytes();

        let input = vec![vec1, vec2, vec3];
        let tree = Tree::new(&input, UkkonenBuilder::new());

        let mut s = Searcher::new(&tree, &input);
        test_all_substrings(&input, &mut s);
    }

    #[test]
    fn test_large_random() {
        let mut vecs: Vec<Vec<u8>> = vec![];

        for _ in 0..100 {
            let mut vec = vec![];
            for _ in 0..100 {
                vec.push(rand::random::<u8>() % 10 + b'A');
            }
            vec.push(b'$');
            vecs.push(vec);
        }

        let input: Vec<&[u8]> = vecs.iter().map(|v| v.as_slice()).collect();
        let tree = Tree::new(&input, UkkonenBuilder::new());

        let mut s = Searcher::new(&tree, &input);
        test_all_substrings(&input, &mut s);
    }
}