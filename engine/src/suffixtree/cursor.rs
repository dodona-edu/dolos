use std::cmp::min;
use crate::suffixtree::tree::{MAX_CHILDREN, Node, NodeIndex, Nullable, Range, Tree};

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
    pub tree: &'a mut Tree,
}

impl<'a> Cursor<'a> {
    pub fn new(tree: &'a mut Tree) -> Cursor<'a> {
        Cursor {
            current_node_index_in_arena: 0,
            index: 0,
            tree,
        }
    }

    /// Try to progress by consuming `next_character`
    /// Returns CursorIterator::Ok if this succeeds,
    /// otherwise CursorIterator::InWord or CursorIterator::AtEnd is returned to indicate where in a node we are
    pub fn next(&mut self, next_character: u8, bytes_input: &[u8]) -> CursorIterator {
        let current_node = &self.tree.arena[self.current_node_index_in_arena];
        if self.index < current_node.range.length() {
            if bytes_input[current_node.range.start + self.index] == next_character {
                self.index += 1;
                return CursorIterator::Ok;
            }
            return CursorIterator::InWord;
        }

        let child = current_node.get_child(next_character);
        if !child.is_null() {
            self.current_node_index_in_arena = child;
            self.index = 1;
            return CursorIterator::Ok;
        }

        CursorIterator::AtEnd
    }

    /// Reset the cursor to the root of the tree
    pub fn reset(&mut self) {
        self.index = 0;
        self.current_node_index_in_arena = 0;
    }

    /// the split function for the naive builder
    pub fn split_and_add_naive(&mut self, index_in_entry: usize, end_index: usize, input_string: &[u8]) {
        let new_node = Node::new(Range::new(index_in_entry, end_index), self.current_node_index_in_arena, [NodeIndex::NULL; MAX_CHILDREN], NodeIndex::NULL, NodeIndex::NULL);
        let new_node_char = input_string[new_node.range.start];
        let new_node_index = self.tree.arena.len();
        self.tree.arena.push(new_node);

        let current_node = &mut self.tree.arena[self.current_node_index_in_arena];
        let node_to_insert_in_edge = Node::new(Range::new(current_node.range.start + self.index, current_node.range.end), self.current_node_index_in_arena, current_node.children, NodeIndex::NULL, NodeIndex::NULL);
        current_node.set_new_children(
            vec![
                (input_string[node_to_insert_in_edge.range.start], new_node_index + 1), // index is 1 higher than the already pushed top
                (new_node_char, new_node_index),
            ]
        );

        current_node.range.end = current_node.range.start + self.index;
        self.tree.arena.push(node_to_insert_in_edge); // execute the push!
    }

    /// Add a leaf in the naive building algorithm
    pub fn add_leaf_naive(&mut self, index_in_entry: usize, end_index: usize, input_string: &[u8]) {
        let new_node = Node::new(Range::new(index_in_entry, end_index), self.current_node_index_in_arena, [NodeIndex::NULL; MAX_CHILDREN], NodeIndex::NULL, NodeIndex::NULL);
        let new_node_index = self.tree.arena.len();
        self.tree.arena.push(new_node);
        let current_node = &mut self.tree.arena[self.current_node_index_in_arena];
        current_node.add_child(input_string[index_in_entry], new_node_index);
    }

    /// Returns true if the cursor is positioned at a node and not somewhere in an edge
    pub fn at_node(&self) -> bool {
        self.index == self.tree.arena[self.current_node_index_in_arena].range.length()
    }

    /// Adds a link from the `receiver` node to the `link_to` node
    pub fn add_link(&mut self, receiver: usize, link_to: usize) {
        self.tree.arena[receiver].link = link_to;
    }

    /// Split edge implementation for Ukkonen
    pub fn split_edge(&mut self, input_string: &[u8]) -> usize {
        // first get the index where the next node will be inserted, do this before we have a mutable borrow
        let new_internal_node_index_in_arena = self.tree.arena.len();
        // create the new node
        let current_node = &mut self.tree.arena[self.current_node_index_in_arena];
        let new_internal_node_end = current_node.range.start + self.index;
        let new_internal_node = Node::new_with_child_tuples(
            Range::new(current_node.range.start, new_internal_node_end),
            current_node.parent,
            vec![
                (input_string[new_internal_node_end], self.current_node_index_in_arena)
            ],
            NodeIndex::NULL,
            NodeIndex::NULL,
        );
        let parent_index_in_arena = current_node.parent; // temp store the index since we will need it later
        // update current node
        current_node.range.start += self.index;
        current_node.parent = new_internal_node_index_in_arena;
        // update the parent now we have updated everything needed to the current node
        let parent = &mut self.tree.arena[parent_index_in_arena];
        parent.add_child(input_string[new_internal_node.range.start], new_internal_node_index_in_arena);
        // actually push the new internal node and update the cursor
        self.tree.arena.push(new_internal_node);
        self.current_node_index_in_arena = new_internal_node_index_in_arena;

        new_internal_node_index_in_arena
    }

    /// Add a leaf with suffix index used in the Ukkonen implementation
    pub fn add_leaf_from_position(&mut self, j: usize, suffix_index: usize, input_string: &[u8]) {
        let new_leaf = Node::new(
            Range::new(j, input_string.len()),
            self.current_node_index_in_arena,
            [NodeIndex::NULL; MAX_CHILDREN],
            NodeIndex::NULL,
            suffix_index,
        );
        let new_leaf_position_in_arena = self.tree.arena.len();
        let current_node = &mut self.tree.arena[self.current_node_index_in_arena];
        current_node.add_child(input_string[j], new_leaf_position_in_arena);
        self.tree.arena.push(new_leaf);
    }

    /// Follow the suffix link during the Ukkonen algorithm
    pub fn follow_link(&mut self, input_string: &[u8]) {
        if self.current_node_index_in_arena == 0 {
            return;
        }

        let mut current_node = &self.tree.arena[self.current_node_index_in_arena];
        let mut begin = current_node.range.start;

        let mut distance_left_to_walk;
        if current_node.parent == 0 { // parent with index 0 is the root
            self.current_node_index_in_arena = 0;
            begin += 1;
            distance_left_to_walk = self.index - 1;
        } else {
            // follow link
            distance_left_to_walk = self.index; // distance before following link
            self.current_node_index_in_arena = self.tree.arena[current_node.parent].link;
        }
        current_node = &self.tree.arena[self.current_node_index_in_arena];
        self.index = current_node.range.length();

        while distance_left_to_walk > 0 {
            // move to child
            self.current_node_index_in_arena = current_node.get_child(input_string[begin]);
            current_node = &self.tree.arena[self.current_node_index_in_arena];

            // walk as far as possible on current edge
            let current_advance = min(current_node.range.length(), distance_left_to_walk);
            distance_left_to_walk -= current_advance;
            begin += current_advance;
            self.index = current_advance;
        }
    }
}

#[cfg(test)]
mod tests {
    use crate::suffixtree::cursor::Cursor;
    use crate::suffixtree::tree::{MAX_CHILDREN, Node, NodeIndex, Nullable, Range, Tree};

    #[test]
    fn test_split_edge() {
        let input = "ACAB$";

        let mut tree = Tree {
            arena: vec![
                Node::new(
                    Range::new(0, 0),
                    NodeIndex::NULL,
                    [NodeIndex::NULL; MAX_CHILDREN],
                    NodeIndex::NULL,
                    NodeIndex::NULL,
                ),
                Node::new(
                    Range::new(0, 5),
                    0,
                    [NodeIndex::NULL; MAX_CHILDREN],
                    NodeIndex::NULL,
                    NodeIndex::NULL,
                ),
                Node::new(
                    Range::new(1, 5),
                    0,
                    [NodeIndex::NULL; MAX_CHILDREN],
                    NodeIndex::NULL,
                    NodeIndex::NULL,
                ),
            ]
        };

        tree.arena[0].add_child(b'A', 1);
        tree.arena[0].add_child(b'C', 2);

        let mut control_tree = Tree {
            arena: vec![
                Node::new(
                    Range::new(0, 0),
                    NodeIndex::NULL,
                    [NodeIndex::NULL; MAX_CHILDREN],
                    NodeIndex::NULL,
                    NodeIndex::NULL,
                ),
                Node::new(
                    Range::new(1, 5),
                    3,
                    [NodeIndex::NULL; MAX_CHILDREN],
                    NodeIndex::NULL,
                    NodeIndex::NULL,
                ),
                Node::new(
                    Range::new(1, 5),
                    0,
                    [NodeIndex::NULL; MAX_CHILDREN],
                    NodeIndex::NULL,
                    NodeIndex::NULL,
                ),
                Node::new(
                    Range::new(0, 1),
                    0,
                    [NodeIndex::NULL; MAX_CHILDREN],
                    NodeIndex::NULL,
                    NodeIndex::NULL,
                ),
            ]
        };

        control_tree.arena[0].add_child(b'A', 3);
        control_tree.arena[0].add_child(b'C', 2);
        control_tree.arena[3].add_child(b'C', 1);

        let mut cursor = Cursor { current_node_index_in_arena: 1, index: 1, tree: &mut tree };
        cursor.split_edge(input.as_bytes());

        assert_eq!(cursor, Cursor { current_node_index_in_arena: 3, index: 1, tree: &mut control_tree })
    }
}