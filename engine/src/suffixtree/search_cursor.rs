use crate::suffixtree::tree::{Node, Nullable, Tree};

/// A Cursor that cannot mutate the tree (which means it can only be used during the search phase).
/// Because it does not need a mutable reference, we can directly store a reference to the node,
/// and not an index in the arena
pub struct SearchCursor<'a> {
    pub current_node: &'a Node,
    pub index: usize,
    pub tree: &'a Tree,
}

impl<'a> SearchCursor<'a> {
    pub fn new(tree: &'a Tree) -> SearchCursor<'a> {
        Self {
            current_node: &tree.arena[0],
            index: 0,
            tree,
        }
    }

    /// Try to progress by consuming `next_character`
    /// Returns Some(()) if we were able to move to the next location.
    /// None otherwise
    pub fn next(&mut self, next_character: u8, bytes_input: &[u8]) -> Option<()> {
        if self.index < self.current_node.range.length() {
            if bytes_input[self.current_node.range.start + self.index] == next_character {
                self.index += 1;
                return Some(());
            }
            return None;
        }

        let child = self.current_node.get_child(next_character);
        if !child.is_null() {
            self.current_node = &self.tree.arena[child];
            self.index = 1;
            return Some(());
        }

        None
    }

    pub fn reset(&mut self) {
        self.index = 0;
        self.current_node = &self.tree.arena[0];
    }
}