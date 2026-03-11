use crate::suffixtree::node::{Node, Range};
use crate::suffixtree::suffixtree::SuffixTree;
use crate::suffixtree::types::{NodeIndex, SymbolType};
use std::cmp::min;

/// Result of a cursor movement operation.
#[derive(Debug, PartialEq)]
pub enum CursorIterator {
    /// The movement was successful.
    Ok,
    /// Reached the end of an edge.
    AtEnd,
    /// Currently in the middle of an edge.
    InWord,
}

/// A mutable cursor used during the construction of the suffix tree.
#[derive(Debug, PartialEq)]
pub struct BuildCursor<'a> {
    /// Index of the current node in the arena.
    pub node_index: NodeIndex,
    /// Number of symbols consumed along the edge leading to the current node.
    pub index: usize,
    /// Current position in the input sequence being processed.
    pub index_in_word: usize,
    /// Reference to the suffix tree being built.
    pub tree: &'a mut SuffixTree,
}

impl<'a> BuildCursor<'a> {
    /// Creates a new cursor at the root of the tree.
    pub fn new(tree: &'a mut SuffixTree) -> BuildCursor<'a> {
        BuildCursor {
            node_index: 0,
            index: 0,
            index_in_word: 0,
            tree,
        }
    }

    /// Try to progress by consuming `next_symbol`
    /// Returns `CursorIterator::Ok` if this succeeds,
    /// otherwise `CursorIterator::InWord` or `CursorIterator::AtEnd` is returned to indicate where in a node we are.
    pub fn next(&mut self, next_symbol: SymbolType, data: &[Vec<SymbolType>]) -> CursorIterator {
        let current_node = &self.tree.arena[self.node_index];
        if self.index < current_node.range.length() {
            if data[current_node.range.input][current_node.range.start + self.index] == next_symbol
            {
                self.index += 1;
                self.index_in_word += 1;
                return CursorIterator::Ok;
            }
            return CursorIterator::InWord;
        }

        if let Some(child) = current_node.get_child(next_symbol) {
            self.node_index = *child;
            self.index = 1;
            self.index_in_word += 1;
            return CursorIterator::Ok;
        }

        CursorIterator::AtEnd
    }

    /// Move the cursor back by one symbol.
    pub fn return_one_symbol(&mut self) {
        self.index -= 1;
        self.index_in_word -= 1;

        if self.index == 0 {
            if let Some(parent) = self.tree.arena[self.node_index].parent {
                self.node_index = parent;
                self.index = self.tree.arena[self.node_index].range.length();
            }
        }
    }

    /// Reset the cursor to the root of the tree
    pub fn reset(&mut self) {
        self.index = 0;
        self.node_index = 0;
        self.index_in_word = 0;
    }

    /// Returns true if the cursor is positioned at a node and not somewhere in an edge
    pub fn at_node(&self) -> bool {
        self.index == self.tree.arena[self.node_index].range.length()
    }

    /// Adds a link from the `receiver` node to the `link_to` node
    pub fn add_link(&mut self, receiver: NodeIndex, link_to: NodeIndex) {
        self.tree.arena[receiver].link = Some(link_to);
    }

    /// Adds an input sequence index to the current node's set of inputs.
    pub fn add_input(&mut self, input: usize) {
        self.tree.arena[self.node_index]
            .inputs
            .as_mut()
            .expect("Cannot add input to node with None inputs")
            .insert(input);
    }

    /// Split edge implementation for Ukkonen
    pub fn split_edge(&mut self, input_strings: &[Vec<SymbolType>]) -> NodeIndex {
        // first get the index where the next node will be inserted, do this before we have a mutable borrow
        let new_internal_node_index_in_arena = self.tree.arena.len();
        // create the new node
        let current_node = &mut self.tree.arena[self.node_index];
        let new_internal_node_end = current_node.range.start + self.index;
        let parent_index_in_arena = current_node
            .parent
            .expect("Current node should have a parent");

        let split_symbol = input_strings[current_node.range.input][new_internal_node_end];

        let new_internal_node = Node::create_internal_node_with_child(
            Range::new(
                current_node.range.start,
                new_internal_node_end,
                current_node.range.input,
            ),
            parent_index_in_arena,
            split_symbol,
            self.node_index,
        );

        // update current node
        current_node.range.start += self.index;
        current_node.parent = Some(new_internal_node_index_in_arena);
        // update the parent now we have updated everything needed to the current node
        let parent = &mut self.tree.arena[parent_index_in_arena];
        parent.add_child(
            input_strings[new_internal_node.range.input][new_internal_node.range.start],
            new_internal_node_index_in_arena,
        );
        // actually push the new internal node and update the cursor
        self.tree.arena.push(new_internal_node);
        self.node_index = new_internal_node_index_in_arena;

        new_internal_node_index_in_arena
    }

    /// Add a leaf with a suffix index used in the Ukkonen implementation
    pub fn add_leaf_from_position(&mut self, j: usize, input: usize, input_string: &[SymbolType]) {
        let new_leaf = Node::create_leaf(Range::new(j, input_string.len(), input), self.node_index);

        let new_leaf_position_in_arena = self.tree.arena.len();
        let current_node = &mut self.tree.arena[self.node_index];
        current_node.add_child(input_string[j], new_leaf_position_in_arena);
        self.tree.arena.push(new_leaf);
    }

    /// Follow the suffix link during the Ukkonen algorithm
    pub fn follow_link(&mut self, data: &[SymbolType]) {
        if self.node_index == 0 || self.index == 0 {
            return;
        }

        let mut current_node = &self.tree.arena[self.node_index];

        let mut distance_left_to_walk;
        if let Some(parent_index) = current_node.parent {
            if parent_index == 0 {
                // the parent is the root
                self.node_index = 0;
                distance_left_to_walk = self.index - 1;
                self.index_in_word -= self.index - 1;
            } else {
                // follow link
                distance_left_to_walk = self.index; // distance before following the link
                self.index_in_word -= self.index;
                let parent_node = &self.tree.arena[parent_index];
                self.node_index = parent_node.link.expect("Parent must have a suffix link");
            }
        } else {
            // No parent means we're at root (shouldn't happen due to early return)
            return;
        }

        current_node = &self.tree.arena[self.node_index];
        self.index = current_node.range.length();

        while distance_left_to_walk > 0 {
            // move to child
            self.node_index = *current_node
                .get_child(data[self.index_in_word])
                .expect("Child must exist during tree traversal");
            current_node = &self.tree.arena[self.node_index];

            // walk as far as possible on the current edge
            let current_advance = min(current_node.range.length(), distance_left_to_walk);
            distance_left_to_walk -= current_advance;
            self.index_in_word += current_advance;
            self.index = current_advance;
        }
    }
}

#[cfg(test)]
mod tests {
    use crate::suffixtree::build_cursor::BuildCursor;
    use crate::suffixtree::node::{Node, Range};
    use crate::suffixtree::suffixtree::SuffixTree;
    use crate::suffixtree::types::SymbolType;

    pub fn str_to_nodes(s: &str) -> Vec<SymbolType> {
        s.as_bytes().iter().map(|&b| b as SymbolType).collect()
    }

    #[test]
    fn test_split_edge() {
        let mut tree = SuffixTree {
            arena: vec![
                Node::new(Range::new(0, 0, 0), None, None, None, None),
                Node::new(Range::new(0, 5, 0), Some(0), None, None, None),
                Node::new(Range::new(1, 5, 0), Some(0), None, None, None),
            ],
        };

        tree.arena[0].add_child(65, 1);
        tree.arena[0].add_child(67, 2);

        let mut control_tree = SuffixTree {
            arena: vec![
                Node::new(Range::new(0, 0, 0), None, None, None, None),
                Node::new(Range::new(1, 5, 0), Some(3), None, None, None),
                Node::new(Range::new(1, 5, 0), Some(0), None, None, None),
                Node::new(Range::new(0, 1, 0), Some(0), None, None, None),
            ],
        };

        control_tree.arena[0].add_child(65, 3);
        control_tree.arena[0].add_child(67, 2);
        control_tree.arena[3].add_child(67, 1);

        let mut cursor = BuildCursor {
            node_index: 1,
            index: 1,
            index_in_word: 2,
            tree: &mut tree,
        };
        let inputs = vec![str_to_nodes("ACAB$")];
        cursor.split_edge(&inputs);

        assert_eq!(
            cursor,
            BuildCursor {
                node_index: 3,
                index: 1,
                index_in_word: 2,
                tree: &mut control_tree,
            }
        )
    }
}
