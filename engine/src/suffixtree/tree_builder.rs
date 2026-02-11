use crate::suffixtree::cursor::{Cursor, CursorIterator};
use crate::suffixtree::SEPARATION_CHARACTER;
use crate::suffixtree::tree::{NodeIndex, Tree};

pub trait TreeBuilder {
    fn new() -> Self;

    fn build(&self, data: &Vec<u8>, tree: Tree) -> Tree;
}

pub struct UkkonenBuilder;
impl TreeBuilder for UkkonenBuilder {
    fn new() -> Self {
        Self
    }

    fn build(&self, data: &Vec<u8>, mut tree: Tree) -> Tree {
        let mut cursor = Cursor::new(&mut tree);
        let end_index = data.len();
        let mut current_protein_index: usize = 0;
        let mut num_leaves = 0;
        for j in 1..=end_index {
            let mut prev_internal_node: Option<NodeIndex> = None;
            let num_leaves_copy = num_leaves; // take copy since we cannot change the value that is used in the loop header itself
            // skip the first numLeaves leaves since this is rule 1 and can be skipped
            for i in num_leaves_copy..j {
                // if there is a previous internal node AND we are at a node with the cursor
                if let (Some(prev_internal_node_index), true) = (prev_internal_node, cursor.at_node()) {
                    cursor.add_link(prev_internal_node_index, cursor.current_node_index_in_arena);
                    prev_internal_node = None;
                }

                if cursor.next(data[j - 1], data) == CursorIterator::Ok {
                    break; // rule 3 : do nothing + show stopper
                }

                // rule 2: split edge if needed and add leaf
                if !cursor.at_node() {
                    let new_internal_node_index = cursor.split_edge(data);
                    if let Some(prev_current_node_index) = prev_internal_node {
                        cursor.add_link(prev_current_node_index, new_internal_node_index);
                    }
                    prev_internal_node = Some(new_internal_node_index);
                }
                cursor.add_leaf_from_position(j - 1, current_protein_index, data);
                num_leaves += 1;
                if data[i] == SEPARATION_CHARACTER {
                    current_protein_index += 1;
                }

                // follow the suffix link since the extension is complete
                cursor.follow_link(data);
            }
        }

        tree
    }
}
