use crate::suffixtree::tree::{Tree};
use std::cmp::min;
use std::collections::{HashMap, HashSet};
use crate::suffixtree::node::{Node, NodeIndex, Nullable, Range};

#[derive(Debug, PartialEq)]
pub enum CursorIterator {
    Ok,
    AtEnd,
    InWord,
}

#[derive(Debug, PartialEq)]
pub struct Cursor<'a> {
    pub current_node_index_in_arena: usize,
    pub index: usize,
    pub index_in_word: usize,
    pub tree: &'a mut Tree,
}

impl<'a> Cursor<'a> {
    pub fn new(tree: &'a mut Tree) -> Cursor<'a> {
        Cursor {
            current_node_index_in_arena: 0,
            index: 0,
            index_in_word: 0,
            tree,
        }
    }

    /// Try to progress by consuming `next_character`
    /// Returns CursorIterator::Ok if this succeeds,
    /// otherwise CursorIterator::InWord or CursorIterator::AtEnd is returned to indicate where in a node we are
    pub fn next(&mut self, next_character: u8, bytes_input: &[&[u8]]) -> CursorIterator {
        let current_node = &self.tree.arena[self.current_node_index_in_arena];
        if self.index < current_node.range.length() {
            if bytes_input[current_node.range.input][current_node.range.start + self.index] == next_character {
                self.index += 1;
                self.index_in_word += 1;
                return CursorIterator::Ok;
            }
            return CursorIterator::InWord;
        }

        let child = current_node.get_child(next_character);
        if !child.is_null() {
            self.current_node_index_in_arena = child;
            self.index = 1;
            self.index_in_word += 1;
            return CursorIterator::Ok;
        }

        CursorIterator::AtEnd
    }

    pub fn return_one(&mut self) {
        self.index -= 1;
        self.index_in_word -= 1;

        if self.index == 0 && self.current_node_index_in_arena != 0 {
            self.current_node_index_in_arena = self.tree.arena[self.current_node_index_in_arena].parent;
            self.index = self.tree.arena[self.current_node_index_in_arena].range.length();
        }
    }

    /// Reset the cursor to the root of the tree
    pub fn reset(&mut self) {
        self.index = 0;
        self.current_node_index_in_arena = 0;
        self.index_in_word = 0;
    }

    /// Returns true if the cursor is positioned at a node and not somewhere in an edge
    pub fn at_node(&self) -> bool {
        self.index == self.tree.arena[self.current_node_index_in_arena].range.length()
    }

    /// Adds a link from the `receiver` node to the `link_to` node
    pub fn add_link(&mut self, receiver: usize, link_to: usize) {
        self.tree.arena[receiver].link = link_to;
    }

    pub fn add_input(&mut self, input: usize) {
        self.tree.arena[self.current_node_index_in_arena].inputs.insert(input);
    }

    /// Split edge implementation for Ukkonen
    pub fn split_edge(&mut self, input_strings: &[&[u8]]) -> usize {
        // first get the index where the next node will be inserted, do this before we have a mutable borrow
        let new_internal_node_index_in_arena = self.tree.arena.len();
        // create the new node
        let current_node = &mut self.tree.arena[self.current_node_index_in_arena];
        let new_internal_node_end = current_node.range.start + self.index;
        let new_internal_node = Node::new_with_child_tuples(
            Range::new(current_node.range.start, new_internal_node_end, current_node.range.input),
            current_node.parent,
            vec![
                (input_strings[current_node.range.input][new_internal_node_end], self.current_node_index_in_arena)
            ],
            NodeIndex::NULL,
            HashSet::new(),
        );
        let parent_index_in_arena = current_node.parent; // temp store the index since we will need it later
        // update current node
        current_node.range.start += self.index;
        current_node.parent = new_internal_node_index_in_arena;
        // update the parent now we have updated everything needed to the current node
        let parent = &mut self.tree.arena[parent_index_in_arena];
        parent.add_child(input_strings[new_internal_node.range.input][new_internal_node.range.start], new_internal_node_index_in_arena);
        // actually push the new internal node and update the cursor
        self.tree.arena.push(new_internal_node);
        self.current_node_index_in_arena = new_internal_node_index_in_arena;

        new_internal_node_index_in_arena
    }

    /// Add a leaf with suffix index used in the Ukkonen implementation
    pub fn add_leaf_from_position(&mut self, j: usize, input: usize, input_string: &[u8]) {
        let new_leaf = Node::new(
            Range::new(j, input_string.len(), input),
            self.current_node_index_in_arena,
            HashMap::new(),
            NodeIndex::NULL,
            HashSet::from([input]),
        );
        let new_leaf_position_in_arena = self.tree.arena.len();
        let current_node = &mut self.tree.arena[self.current_node_index_in_arena];
        current_node.add_child(input_string[j], new_leaf_position_in_arena);
        self.tree.arena.push(new_leaf);
    }

    /// Follow the suffix link during the Ukkonen algorithm
    pub fn follow_link(&mut self, data: &[u8]) {
        if self.current_node_index_in_arena == 0 || self.index == 0 {
            return;
        }

        let mut current_node = &self.tree.arena[self.current_node_index_in_arena];

        let mut distance_left_to_walk;
        if current_node.parent == 0 { // parent with index 0 is the root
            self.current_node_index_in_arena = 0;
            distance_left_to_walk = self.index - 1;
            self.index_in_word -= self.index - 1;
        } else {
            // follow link
            distance_left_to_walk = self.index; // distance before following link
            self.index_in_word -= self.index;
            self.current_node_index_in_arena = self.tree.arena[current_node.parent].link;
        }
        current_node = &self.tree.arena[self.current_node_index_in_arena];
        self.index = current_node.range.length();

        while distance_left_to_walk > 0 {
            // move to child
            self.current_node_index_in_arena = current_node.get_child(data[self.index_in_word]);
            current_node = &self.tree.arena[self.current_node_index_in_arena];

            // walk as far as possible on current edge
            let current_advance = min(current_node.range.length(), distance_left_to_walk);
            distance_left_to_walk -= current_advance;
            self.index_in_word += current_advance;
            self.index = current_advance;
        }
    }
}

#[cfg(test)]
mod tests {
    use crate::suffixtree::cursor::Cursor;
    use crate::suffixtree::tree::{Tree};
    use std::collections::{HashMap, HashSet};
    use crate::suffixtree::node::{Node, NodeIndex, Nullable, Range};

    #[test]
    fn test_split_edge() {
        let input = "ACAB$";

        let mut tree = Tree {
            arena: vec![
                Node::new(
                    Range::new(0, 0, 0),
                    NodeIndex::NULL,
                    HashMap::new(),
                    NodeIndex::NULL,
                    HashSet::new(),

                ),
                Node::new(
                    Range::new(0, 5, 0),
                    0,
                    HashMap::new(),
                    NodeIndex::NULL,
                    HashSet::new(),
                ),
                Node::new(
                    Range::new(1, 5, 0),
                    0,
                    HashMap::new(),
                    NodeIndex::NULL,
                    HashSet::new(),
                ),
            ]
        };

        tree.arena[0].add_child(b'A', 1);
        tree.arena[0].add_child(b'C', 2);

        let mut control_tree = Tree {
            arena: vec![
                Node::new(
                    Range::new(0, 0, 0),
                    NodeIndex::NULL,
                    HashMap::new(),
                    NodeIndex::NULL,
                    HashSet::new(),
                ),
                Node::new(
                    Range::new(1, 5, 0),
                    3,
                    HashMap::new(),
                    NodeIndex::NULL,
                    HashSet::new(),
                ),
                Node::new(
                    Range::new(1, 5, 0),
                    0,
                    HashMap::new(),
                    NodeIndex::NULL,
                    HashSet::new(),
                ),
                Node::new(
                    Range::new(0, 1, 0),
                    0,
                    HashMap::new(),
                    NodeIndex::NULL,
                    HashSet::new(),
                ),
            ]
        };

        control_tree.arena[0].add_child(b'A', 3);
        control_tree.arena[0].add_child(b'C', 2);
        control_tree.arena[3].add_child(b'C', 1);

        let mut cursor = Cursor { current_node_index_in_arena: 1, index: 1, index_in_word: 2, tree: &mut tree };
        let vec1 = input.as_bytes();
        let inputs = vec![vec1];
        cursor.split_edge(&inputs);

        assert_eq!(cursor, Cursor { current_node_index_in_arena: 3, index: 1, index_in_word: 2, tree: &mut control_tree })
    }
}