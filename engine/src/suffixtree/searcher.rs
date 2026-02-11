use crate::suffixtree::search_cursor::SearchCursor;
use crate::suffixtree::tree::{Node, Nullable, Tree};

pub struct Searcher<'a> {
    cursor: SearchCursor<'a>,
    original_input_string: &'a [u8]
}

impl<'a> Searcher<'a> {
    pub fn new(tree: &'a Tree, original_input_string: &'a [u8]) -> Self {
        Self {
            cursor: SearchCursor::new(tree),
            original_input_string
        }
    }

    /// Return true as first value of the tuple if we have a valid match until the end
    /// the second value of the tuple is the index of the last current node in the arena during search
    fn find_end_node(&mut self, search_string: &[u8]) -> (bool, &'a Node) {
        if search_string.is_empty() {
            return (true, &self.cursor.tree.arena[0]);
        }
        let string_length = search_string.len();
        let mut index_in_string: usize = 0;

        while self.cursor.next(search_string[index_in_string], self.original_input_string).is_some() {
            index_in_string += 1;
            if index_in_string == string_length {
                let end_node = self.cursor.current_node;
                self.cursor.reset(); // prepare cursor for next search
                return (true, end_node);
            }
        }

        let end_node = self.cursor.current_node;
        self.cursor.reset(); // prepare cursor for next search

        (false, end_node)
    }

    pub fn find_all_suffix_indices(&mut self, search_string: &[u8]) -> Vec<usize> {
        let (match_found, end_node) = self.find_end_node(search_string);
        if !match_found {
            return vec![];
        }
        let mut suffix_indices_list: Vec<usize> = vec![];
        let mut stack = vec![end_node];
        while let Some(current_node) = stack.pop() {
            if !current_node.suffix_index.is_null() {
                suffix_indices_list.push(current_node.suffix_index);
            } else {
                current_node.children.iter().for_each(|&child| {
                    if !child.is_null() {
                        stack.push(&self.cursor.tree.arena[child]);
                    }
                });
            }
        }
        suffix_indices_list
    }

    pub fn search_if_match(&mut self, search_string: &[u8]) -> bool {
        self.find_end_node(search_string).0
    }
}

#[cfg(test)]
mod tests {
    use crate::suffixtree::searcher::Searcher;
    use crate::suffixtree::tree::Tree;
    use crate::suffixtree::tree_builder::{TreeBuilder, UkkonenBuilder};

    #[test]
    fn test_simple_search() {
        let input = "ABX-ABC$".as_bytes().to_vec();
        let tree = Tree::new(&input, UkkonenBuilder::new());
        let mut searcher = Searcher::new(&tree, &input);

        assert!(searcher.search_if_match("ABX".as_bytes()));
        assert!(searcher.search_if_match("ABC".as_bytes()));
        assert_eq!(searcher.find_all_suffix_indices("AB".as_bytes()), vec![0,1]);
    }

    #[test]
    fn test_no_match_between_inputs() {
        let input = "ABC-ABD-ABE$".as_bytes().to_vec();
        let tree = Tree::new(&input, UkkonenBuilder::new());
        let mut searcher = Searcher::new(&tree, &input);
        
        assert!(!searcher.search_if_match("C-A".as_bytes()));
        assert!(!searcher.search_if_match("D-A".as_bytes()));
        assert!(!searcher.search_if_match("C-ABD-A".as_bytes()));
    }

    #[test]
    fn test_suffix_indices_equal_input() {
        let input = "ABC-ABC$".as_bytes().to_vec();
        let tree = Tree::new(&input, UkkonenBuilder::new());
        let mut searcher = Searcher::new(&tree, &input);

        let mut result = searcher.find_all_suffix_indices("ABC".as_bytes());
        result.sort();
        assert_eq!(result, vec![0, 1]);
    }
}