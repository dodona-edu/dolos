use crate::suffixtree::types::{NodeIndex, SymbolType};
use std::collections::{HashMap, HashSet};

/// Represents a node in the suffix tree.
#[derive(Debug, PartialEq)]
pub struct Node {
    /// The range of symbols this node represents in one of the words.
    pub range: Range,
    /// The index of the parent node in the arena.
    pub parent: Option<NodeIndex>,
    /// Suffix link to another node in the tree, used by Ukkonen's algorithm.
    pub link: Option<NodeIndex>,
    /// Map of children nodes indexed by the first symbol of their edge.
    pub children: Option<HashMap<SymbolType, NodeIndex>>,
    /// Indices of words that have a suffix ending at this leaf node.
    pub word_indices: Option<HashSet<usize>>,
}

impl Node {
    /// Creates a new root node for the suffix tree.
    pub fn create_root() -> Self {
        Node::new(Range::new(0, 0, 0), None, None, None, None)
    }

    /// Creates a new node with the given parameters.
    pub fn new(
        range: Range,
        parent: Option<NodeIndex>,
        children: Option<HashMap<SymbolType, NodeIndex>>,
        link: Option<NodeIndex>,
        word_indices: Option<HashSet<usize>>,
    ) -> Node {
        Node { range, children, parent, link, word_indices }
    }

    pub fn create_leaf(range: Range, parent: NodeIndex) -> Node {
        let word = range.word;
        Node::new(range, Some(parent), None, None, Some(HashSet::from([word])))
    }

    /// Creates an internal node with a single child.
    pub fn create_internal_node_with_child(
        range: Range,
        parent: NodeIndex,
        child_symbol: SymbolType,
        child_index: NodeIndex,
    ) -> Node {
        let mut node = Node::new(range, Some(parent), Some(HashMap::new()), None, None);
        node.add_child(child_symbol, child_index);
        node
    }

    /// Adds a child to this node.
    pub fn add_child(&mut self, symbol: SymbolType, child: NodeIndex) {
        self.children
            .get_or_insert_with(HashMap::new)
            .insert(symbol, child);
    }

    /// Returns the index of the child node corresponding to the given symbol.
    pub fn get_child(&self, symbol: SymbolType) -> Option<&NodeIndex> {
        self.children
            .as_ref()
            .and_then(|children| children.get(&symbol))
    }
}

/// Represents a range of symbols in a word.
#[derive(Debug, PartialEq)]
pub struct Range {
    /// The start index of the range (inclusive).
    pub start: usize,
    /// The end index of the range (exclusive).
    pub end: usize,
    /// The index of the word this range belongs to.
    pub word: usize,
}

impl Range {
    /// Creates a new range.
    pub fn new(start: usize, end: usize, word_index: usize) -> Self {
        Range { start, end, word: word_index }
    }
    /// Returns the length of the range.
    pub fn length(&self) -> usize {
        self.end - self.start
    }
}
