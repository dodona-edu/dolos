use crate::suffixtree::tree_builder::TreeBuilder;
use crate::suffixtree::{END_CHARACTER, SEPARATION_CHARACTER};
use std::collections::HashMap;

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
    pub fn new(data: &Vec<u8>, builder: impl TreeBuilder) -> Self {
        builder.build(
            data,
            Tree {
                arena: vec![Node::create_root()],
            },
        )
    }
}

#[derive(Debug, PartialEq)]
pub struct Node {
    pub range: Range,
    pub children: HashMap<NodeIndex, NodeIndex>,
    pub parent: NodeIndex,
    pub link: NodeIndex,
    pub suffix_index: NodeIndex,
}

impl Node {
    pub fn create_root() -> Self {
        Node {
            range: Range::new(0, 0),
            children: HashMap::new(),
            parent: NodeIndex::NULL,
            link: NodeIndex::NULL,
            suffix_index: NodeIndex::NULL,
        }
    }

    /// Returns a tuple that contains the index of the new node in the arena and a reference to that node
    pub fn new(range: Range, parent: NodeIndex, children: HashMap<NodeIndex, NodeIndex>, link: NodeIndex, suffix_index: usize) -> Node {
        Node {
            range,
            children,
            parent,
            link,
            suffix_index,
        }
    }

    pub fn new_with_child_tuples(range: Range, parent: NodeIndex, children_tuples: Vec<(u8, NodeIndex)>, link: NodeIndex, suffix_index: usize) -> Node {
        let mut node = Node {
            range,
            children: HashMap::new(),
            parent,
            link,
            suffix_index,
        };
        children_tuples.iter().for_each(|(char, child)| node.add_child(*char, *child));
        node
    }

    fn char_to_child_index(character: u8) -> usize {
        if character == SEPARATION_CHARACTER {
            26
        } else if character == END_CHARACTER {
            27
        } else {
            character as usize - 65 // 65 is 'A' in ascii
        }
    }

    pub fn add_child(&mut self, character: u8, child: NodeIndex) {
        self.children.insert(Self::char_to_child_index(character), child);
    }

    pub fn get_child(&self, character: u8) -> NodeIndex {
        self.children.get(&Self::char_to_child_index(character)).copied().unwrap_or(NodeIndex::NULL)
    }

    pub fn set_new_children(&mut self, new_children: Vec<(u8, NodeIndex)>) {
        self.children = HashMap::new();
        new_children.iter().for_each(|(character, child)| self.add_child(*character, *child));
    }
}

#[derive(Debug, PartialEq)]
pub struct Range {
    pub start: usize,
    pub end: usize,
}

impl Range {
    pub fn new(start: usize, end: usize) -> Self {
        Range { start, end }
    }
    pub fn length(&self) -> usize {
        self.end - self.start
    }
}

#[cfg(test)]
mod tests {
    use crate::suffixtree::searcher::Searcher;
    use crate::suffixtree::tree::{Node, NodeIndex, Nullable, Range, Tree};
    use crate::suffixtree::tree_builder::{TreeBuilder, UkkonenBuilder};
    use std::collections::HashMap;

    #[test]
    fn test_large_alphabet() {
        let mut input = vec![];

        for i in 1..50 {
            input.push(i as u8);
        }
        let tree = Tree::new(&input, UkkonenBuilder::new());
        let mut searcher = Searcher::new(&tree, &input);

        for i in 0..26 {
            assert!(searcher.search_if_match(&input[i..i + 1]));
            assert!(searcher.search_if_match(&input[i..]));
        }
    }

    #[test]
    fn total_test() {
        let input = "ACACACGT$".as_bytes().to_vec();

        let tree = Tree::new(&input, UkkonenBuilder::new());
        let mut control_tree = Tree { arena: vec![] };
        for _ in 0..14 {
            control_tree.arena.push(Node::new(
                Range::new(0, 0),
                NodeIndex::NULL,
                HashMap::new(),
                NodeIndex::NULL,
                NodeIndex::NULL,
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
        control_tree.arena[1].range = Range::new(4, 9);
        control_tree.arena[2].range = Range::new(4, 9);
        control_tree.arena[3].range = Range::new(2, 4);
        control_tree.arena[4].range = Range::new(6, 9);
        control_tree.arena[5].range = Range::new(2, 4);
        control_tree.arena[6].range = Range::new(6, 9);
        control_tree.arena[7].range = Range::new(0, 2);
        control_tree.arena[8].range = Range::new(6, 9);
        control_tree.arena[9].range = Range::new(1, 2);
        control_tree.arena[10].range = Range::new(6, 9);
        control_tree.arena[11].range = Range::new(6, 9);
        control_tree.arena[12].range = Range::new(7, 9);
        control_tree.arena[13].range = Range::new(8, 9);

        // set suffix links
        control_tree.arena[3].link = 5;
        control_tree.arena[5].link = 7;
        control_tree.arena[7].link = 9;
        control_tree.arena[9].link = 0;

        // set suffix indices
        let leaves = vec![1, 4, 8, 2, 6, 10, 11, 12, 13];
        leaves.into_iter().for_each(|i| control_tree.arena[i].suffix_index = 0);

        assert_eq!(tree, control_tree);
    }
}