use crate::suffixtree::node::Node;
use crate::suffixtree::suffixtree::SuffixTree;
use crate::suffixtree::types::SymbolType;

/// A Cursor that cannot mutate the tree (which means it can only be used during the search phase).
/// Because it does not need a mutable reference, we can directly store a reference to the node,
/// and not an index in the arena.
pub struct SearchCursor<'a> {
    /// Reference to the current node.
    pub current_node: &'a Node,
    /// Number of symbols consumed along the edge leading to the current node.
    pub index: usize,
    /// Reference to the suffix tree.
    pub tree: &'a SuffixTree,
}

impl<'a> SearchCursor<'a> {
    /// Creates a new search cursor at the root of the tree.
    pub fn new(tree: &'a SuffixTree) -> SearchCursor<'a> {
        Self {
            current_node: &tree.arena[0],
            index: 0,
            tree,
        }
    }

    /// Try to progress by consuming `next_symbol`
    /// Returns `true` if we were able to move to the next location.
    /// `false` otherwise
    pub fn next(&mut self, next_symbol: SymbolType, bytes_input: &[Vec<SymbolType>]) -> bool {
        if self.index < self.current_node.range.length() {
            if bytes_input[self.current_node.range.input]
                [self.current_node.range.start + self.index]
                == next_symbol
            {
                self.index += 1;
                return true;
            }
            return false;
        }

        if let Some(child) = self.current_node.get_child(next_symbol) {
            self.current_node = &self.tree.arena[*child];
            self.index = 1;
            return true;
        }

        false
    }

    /// Resets the cursor to the root of the tree.
    pub fn reset(&mut self) {
        self.index = 0;
        self.current_node = &self.tree.arena[0];
    }
}
