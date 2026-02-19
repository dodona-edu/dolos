use std::collections::{HashMap, HashSet};

/// Type that represents the index of a node in the arena part of the tree
pub type NodeIndex = usize;
pub type NodeType = usize;

#[derive(Debug, PartialEq)]
pub struct Node {
    pub range: Range,
    pub parent: Option<NodeIndex>,
    pub link: Option<NodeIndex>,
    pub children: Option<HashMap<NodeType, NodeIndex>>,
    pub inputs: Option<HashSet<usize>>,
}


impl Node {
    pub fn create_root() -> Self {
        Node {
            range: Range::new(0, 0, 0),
            children: None,
            parent: None,
            link: None,
            inputs: None,
        }
    }

    /// Returns a tuple that contains the index of the new node in the arena and a reference to that node
    pub fn new(range: Range, parent: Option<NodeIndex>, children: Option<HashMap<NodeType, NodeIndex>>, link: Option<NodeIndex>, inputs: Option<HashSet<usize>>) -> Node {
        Node {
            range,
            children,
            parent,
            link,
            inputs,
        }
    }

    pub fn new_with_child_tuples(range: Range, parent: Option<NodeIndex>, children_tuples: Vec<(NodeType, NodeIndex)>, link: Option<NodeIndex>, inputs: Option<HashSet<usize>>) -> Node {
        let mut node = Node {
            range,
            children: Some(HashMap::new()),
            parent,
            link,
            inputs,
        };
        children_tuples.iter().for_each(|(char, child)| node.add_child(*char, *child));
        node
    }

    pub fn add_child(&mut self, character: NodeType, child: NodeIndex) {
        self.children
            .get_or_insert_with(HashMap::new)
            .insert(character, child);
    }

    pub fn get_child(&self, character: NodeType) -> Option<&NodeIndex> {
        self.children
            .as_ref()
            .and_then(|children| children.get(&character))
    }

    pub fn print(&self, depth: i32, arena: &Vec<Node>) {
        // Print node fields
        println!(
            "Node {{ range: {:?}, parent: {:?}, link: {:?}, inputs: {:?}, children: {:?} }}",
            self.range,
            self.parent,
            self.link,
            self.inputs,
            self.children
        );

        // Recursively print all children
        if let Some(children) = &self.children {
            for (char, &child_index) in children {
                print!("{}", " ".repeat(((depth + 1) * 4) as usize));
                print!("'{}' ->", *char);
                arena[child_index].print(depth + 1, arena);
            }
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