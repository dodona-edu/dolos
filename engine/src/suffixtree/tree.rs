use crate::suffixtree::tree_builder::TreeBuilder;
use crate::suffixtree::{END_CHARACTER, SEPARATION_CHARACTER};
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
    fn total_test() {
        let vec1 = "ACACACGT$".as_bytes();
        let input = vec![vec1];

        let tree = Tree::new(&input, UkkonenBuilder::new());

        tree.print();

        let mut control_tree = Tree { arena: vec![] };
        for _ in 0..14 {
            control_tree.arena.push(Node::new(
                Range::new(0, 0, 0),
                NodeIndex::NULL,
                HashMap::new(),
                NodeIndex::NULL,
                HashSet::new(),
            ));
        }

        // too see the required structure: place the input in: https://brenden.github.io/ukkonen-animation/

        // set the parents right
        control_tree.arena[1].parent = 3;
        control_tree.arena[2].parent = 5;
        control_tree.arena[3].parent = 7;
        control_tree.arena[4].parent = 3;
        control_tree.arena[5].parent = 9;
        control_tree.arena[6].parent = 5;
        control_tree.arena[7].parent = 0;
        control_tree.arena[8].parent = 7;
        control_tree.arena[9].parent = 0;
        control_tree.arena[10].parent = 9;
        control_tree.arena[11].parent = 0;
        control_tree.arena[12].parent = 0;
        control_tree.arena[13].parent = 0;

        // set children
        let children_for_each_node = vec![
            vec![('$', 13), ('A', 7), ('C', 9), ('G', 11), ('T', 12)],
            vec![],
            vec![],
            vec![('A', 1), ('G', 4)],
            vec![],
            vec![('A', 2), ('G', 6)],
            vec![],
            vec![('A', 3), ('G', 8)],
            vec![],
            vec![('A', 5), ('G', 10)],
            vec![],
            vec![],
            vec![],
            vec![],
        ];
        for (i, children) in children_for_each_node.iter().enumerate() {
            children.iter().for_each(|(character, child)| {
                control_tree.arena[i].add_child(*character as u8, *child);
            });
        }

        // set ranges
        control_tree.arena[1].range = Range::new(4, 9, 0);
        control_tree.arena[2].range = Range::new(4, 9, 0);
        control_tree.arena[3].range = Range::new(2, 4, 0);
        control_tree.arena[4].range = Range::new(6, 9, 0);
        control_tree.arena[5].range = Range::new(2, 4, 0);
        control_tree.arena[6].range = Range::new(6, 9, 0);
        control_tree.arena[7].range = Range::new(0, 2, 0);
        control_tree.arena[8].range = Range::new(6, 9, 0);
        control_tree.arena[9].range = Range::new(1, 2, 0);
        control_tree.arena[10].range = Range::new(6,9, 0);
        control_tree.arena[11].range = Range::new(6,9, 0);
        control_tree.arena[13].range = Range::new(8,9, 0);
        control_tree.arena[12].range = Range::new(7,9, 0);

        // set suffix links
        control_tree.arena[3].link = 5;
        control_tree.arena[5].link = 7;
        control_tree.arena[7].link = 9;
        control_tree.arena[9].link = 0;

        // set suffix indices
        let leaves = vec![1, 4, 8, 2, 6, 10, 11, 12, 13];
        leaves.into_iter().for_each(|i| { control_tree.arena[i].inputs.insert(0); });

        assert_eq!(tree, control_tree);
    }
}

mod tests_multiple_inputs {
    use std::collections::{HashMap, HashSet};
    use crate::suffixtree::searcher::Searcher;
    use crate::suffixtree::tree::{Node, NodeIndex, Nullable, Range, Tree};
    use crate::suffixtree::tree_builder::{TreeBuilder, UkkonenBuilder};

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
    fn test_two_overlapping_middle_inputs() {
        let vec1 = "AXYB$".as_bytes();
        let vec2 = "CXYD$".as_bytes();
        let input = vec![vec1, vec2];
        let tree = Tree::new(&input, UkkonenBuilder::new());

        let control_tree = Tree {
            arena: vec![
                Node::new(Range::new(0, 0, 0), NodeIndex::NULL, HashMap::from([(b'A', 1),(b'B', 4),(b'C', 6),(b'D', 11),(b'X', 7),(b'Y', 9),(b'$', 5)]), NodeIndex::NULL, HashSet::new()),
                Node::new(Range::new(0, 5, 0), 0, HashMap::new(), NodeIndex::NULL, HashSet::from([0])),
                Node::new(Range::new(3, 5, 0), 7, HashMap::new(), NodeIndex::NULL, HashSet::from([0])),
                Node::new(Range::new(3, 5, 0), 9, HashMap::new(), NodeIndex::NULL, HashSet::from([0])),
                Node::new(Range::new(3, 5, 0), 0, HashMap::new(), NodeIndex::NULL, HashSet::from([0])),
                Node::new(Range::new(4, 5, 0), 0, HashMap::new(), NodeIndex::NULL, HashSet::from([0, 1])),
                Node::new(Range::new(0, 5, 1), 0, HashMap::new(), NodeIndex::NULL, HashSet::from([1])),
                Node::new(Range::new(1, 3, 0), 0, HashMap::from([(b'B', 2),(b'D', 8)]), 9, HashSet::new()),
                Node::new(Range::new(3, 5, 1), 7, HashMap::new(), NodeIndex::NULL, HashSet::from([1])),
                Node::new(Range::new(2, 3, 0), 0, HashMap::from([(b'B', 3),(b'D', 10)]), 0, HashSet::new()),
                Node::new(Range::new(3, 5, 1), 9, HashMap::new(), NodeIndex::NULL, HashSet::from([1])),
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
    fn test_different_endings() {
        let vec1 = "ABXY$".as_bytes();
        let vec2 = "CDXY$".as_bytes();
        let input = vec![vec1, vec2];
        let tree = Tree::new(&input, UkkonenBuilder::new());

        let mut s = Searcher::new(&tree, &input);

        for i in 0..vec1.len() {
            for j in i+1..=vec1.len() {
                assert!(s.search_if_match(&vec1[i..j]));
                assert!(s.search_if_match(&vec2[i..j]));
            }
        }
    }

    #[test]
    fn test_multiple_inputs() {
        let vec1 = "MISSISSIPPI$".as_bytes();
        let vec2 = "BANANA$".as_bytes();
        let vec3 = "BANANASSIPPI$".as_bytes();

        let input = vec![vec1, vec2, vec3];
        let tree = Tree::new(&input, UkkonenBuilder::new());

        tree.print();

        let mut s = Searcher::new(&tree, &input);
        for vec in &input {
            for i in 0..vec.len() {
                for j in i+1..=vec.len() {
                    assert!(s.search_if_match(&vec[i..j]));
                }
            }
        }
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
        for vec in &vecs {
            for i in 0..vec.len() {
                for j in i+1..=vec.len() {
                    assert!(s.search_if_match(&vec[i..j]));
                }
            }
        }
    }
}