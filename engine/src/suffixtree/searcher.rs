use crate::suffixtree::node::{Node, NodeType};
use crate::suffixtree::search_cursor::SearchCursor;
use crate::suffixtree::tree::{Tree};

pub struct Searcher<'a> {
    cursor: SearchCursor<'a>,
    original_input_string: &'a[&'a[NodeType]]
}

impl<'a> Searcher<'a> {
    pub fn new(tree: &'a Tree, original_input_string: &'a[&'a[NodeType]]) -> Self {
        Self {
            cursor: SearchCursor::new(tree),
            original_input_string
        }
    }

    /// Return true as first value of the tuple if we have a valid match until the end
    /// the second value of the tuple is the index of the last current node in the arena during search
    fn find_end_node(&mut self, search_string: &[NodeType]) -> (bool, &'a Node) {
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

    pub fn find_all_suffix_indices(&mut self, search_string: &[NodeType]) -> Vec<usize> {
        let (match_found, end_node) = self.find_end_node(search_string);
        if !match_found {
            return vec![];
        }
        let mut suffix_indices_list: Vec<usize> = vec![];
        let mut stack = vec![end_node];
        while let Some(current_node) = stack.pop() {
            if !current_node.inputs.is_empty() {
                suffix_indices_list.extend(current_node.inputs.iter());
            } else {
                current_node.children.values().for_each(|child| {
                    stack.push(&self.cursor.tree.arena[*child]);
                });
            }
        }
        suffix_indices_list
    }

    pub fn search_if_match(&mut self, search_string: &[NodeType]) -> bool {
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
        let vec1 = "ABX$".as_bytes();
        let vec2 = "ABC$".as_bytes();
        let input = vec![vec1, vec2];
        
        let tree = Tree::new(&input, UkkonenBuilder::new());
        let mut searcher = Searcher::new(&tree, &input);

        assert!(searcher.search_if_match("ABX".as_bytes()));
        assert!(searcher.search_if_match("ABC".as_bytes()));
        let mut result = searcher.find_all_suffix_indices("AB".as_bytes());
        result.sort();
        assert_eq!(result, vec![0, 1]);
    }

    #[test]
    fn test_no_match_between_inputs() {
        let vec1 = "ABC$".as_bytes();
        let vec2 = "ABD$".as_bytes();
        let vec3 = "ABE$".as_bytes();
        let input = vec![vec1, vec2, vec3];
        
        let tree = Tree::new(&input, UkkonenBuilder::new());
        let mut searcher = Searcher::new(&tree, &input);

        assert!(!searcher.search_if_match("CA".as_bytes()));
        assert!(!searcher.search_if_match("DA".as_bytes()));
        assert!(!searcher.search_if_match("CABDA".as_bytes()));
    }

    #[test]
    fn test_suffix_indices_equal_input() {
        let vec1 = "ABC$".as_bytes();
        let vec2 = "ABC$".as_bytes();
        let input = vec![vec1, vec2];
        
        let tree = Tree::new(&input, UkkonenBuilder::new());
        let mut searcher = Searcher::new(&tree, &input);

        for i in 0..vec1.len() {
            let mut result = searcher.find_all_suffix_indices(&vec1[i..]);
            result.sort();
            
            assert_eq!(result, vec![0, 1]);
        }
    }
}