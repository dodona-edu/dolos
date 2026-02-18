use std::collections::{HashMap, HashSet};

/// Custom trait implemented by types that have a value that represents NULL
pub trait Nullable<T> {
    const NULL: T;

    fn is_null(&self) -> bool;
}

/// Type that represents the index of a node in the arena part of the tree
pub type NodeIndex = usize;
pub type NodeType = u8;

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
pub struct Node {
    pub range: Range,
    pub children: HashMap<NodeType, NodeIndex>,
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
    pub fn new(range: Range, parent: NodeIndex, children: HashMap<NodeType, NodeIndex>, link: NodeIndex, inputs: HashSet<usize>) -> Node {
        Node {
            range,
            children,
            parent,
            link,
            inputs,
        }
    }

    pub fn new_with_child_tuples(range: Range, parent: NodeIndex, children_tuples: Vec<(NodeType, NodeIndex)>, link: NodeIndex, inputs: HashSet<usize>) -> Node {
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

    pub fn add_child(&mut self, character: NodeType, child: NodeIndex) {
        self.children.insert(character, child);
    }

    pub fn get_child(&self, character: NodeType) -> NodeIndex {
        self.children.get(&character).copied().unwrap_or(NodeIndex::NULL)
    }

    pub fn set_new_children(&mut self, new_children: Vec<(NodeType, NodeIndex)>) {
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