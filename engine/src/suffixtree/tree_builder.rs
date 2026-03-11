use crate::suffixtree::build_cursor::{BuildCursor, CursorIterator};
use crate::suffixtree::suffixtree::SuffixTree;
use crate::suffixtree::types::{NodeIndex, SymbolType};

/// A builder that implements Ukkonen's algorithm for linear-time suffix tree construction.
pub struct UkkonenBuilder;

impl UkkonenBuilder {
    pub(crate) fn new() -> Self {
        Self
    }

    pub(crate) fn add_words(&self, data: &[Vec<SymbolType>], tree: &mut SuffixTree) {
        let mut cursor = BuildCursor::new(tree);
        for i in 0..data.len() {
            self.build_single_input(data, i, &mut cursor);
            cursor.reset();
        }
    }

    /// Builds the suffix tree for a single input sequence using Ukkonen's algorithm.
    ///
    /// This method processes the input sequence symbol by symbol and performs implicit
    /// suffix extensions based on three main rules:
    ///
    /// 1. **Rule 1: Extension of existing leaves**. When a leaf node is reached, it
    ///    automatically extends to include the new symbol. In this implementation, this is
    ///    handled efficiently by keeping track of the number of leaves and skipping them
    ///    during the extension loop.
    /// 2. **Rule 2: Splitting an edge**. When a mismatch occurs in the middle of an edge,
    ///    the edge is split, a new internal node is created, and a new leaf node is
    ///    added for the current suffix.
    /// 3. **Rule 3: Show stopper**. When the suffix being added already exists in the
    ///    tree, no changes are made. This acts as a signal to stop further extensions for
    ///    the current step, as all subsequent suffixes will also already exist.
    ///
    /// The algorithm also utilizes suffix links to navigate quickly between related nodes,
    /// ensuring linear-time construction.
    fn build_single_input(
        &self,
        inputs: &[Vec<SymbolType>],
        current_input_index: usize,
        cursor: &mut BuildCursor,
    ) {
        let data = &inputs[current_input_index];
        let end_index = data.len();
        let mut num_leaves = 0;
        for j in 1..=end_index {
            cursor.index_in_word = j - 1;
            let mut prev_internal_node: Option<NodeIndex> = None;
            let num_leaves_copy = num_leaves; // take copy since we cannot change the value that is used in the loop header itself
            // skip the first num_leaves leaves since this is rule 1 and can be skipped
            for _ in num_leaves_copy..j {
                // if there is a previous internal node AND we are at a node with the cursor
                if let Some(prev_internal_node_index) = prev_internal_node
                    && cursor.at_node()
                {
                    cursor.add_link(prev_internal_node_index, cursor.node_index);
                    prev_internal_node = None;
                }

                if cursor.next(data[j - 1], inputs) == CursorIterator::Ok {
                    if j == end_index {
                        // in a leaf
                        cursor.add_input(current_input_index);
                        // decrease the index by 1, because we are simulating that it does not yet know the end symbol
                        cursor.return_one_symbol();
                        cursor.follow_link(data);
                        continue;
                    } else {
                        break; // rule 3 : do nothing + show stopper
                    }
                }

                // rule 2: split edge if needed and add leaf
                if !cursor.at_node() {
                    let new_internal_node_index = cursor.split_edge(inputs);
                    if let Some(prev_current_node_index) = prev_internal_node {
                        cursor.add_link(prev_current_node_index, new_internal_node_index);
                    }
                    prev_internal_node = Some(new_internal_node_index);
                }
                cursor.add_leaf_from_position(j - 1, current_input_index, data);
                num_leaves += 1;

                // follow the suffix link since the extension is complete
                cursor.follow_link(data);
            }
        }
    }
}
