use crate::suffixtree::node::{Node, LetterType};
use crate::suffixtree::search_cursor::SearchCursor;
use crate::suffixtree::tree::{Tree};

pub struct Searcher<'a> {
    cursor: SearchCursor<'a>,
    original_input_string: &'a[Vec<LetterType>]
}

impl<'a> Searcher<'a> {
    pub fn new(tree: &'a Tree, original_input_string: &'a[Vec<LetterType>]) -> Self {
        Self {
            cursor: SearchCursor::new(tree),
            original_input_string
        }
    }

    /// Return true as first value of the tuple if we have a valid match until the end
    /// the second value of the tuple is the index of the last current node in the arena during search
    fn find_end_node(&mut self, search_string: &[LetterType]) -> (bool, &'a Node) {
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


    pub fn find_all_suffix_indices(&mut self, search_string: &[LetterType]) -> Vec<usize> {
        let (match_found, end_node) = self.find_end_node(search_string);
        if !match_found {
            return vec![];
        }

        let mut suffix_indices_list = Vec::new();
        let mut stack = vec![end_node];

        while let Some(current_node) = stack.pop() {
            match (&current_node.inputs, &current_node.children) {
                (Some(inputs), _) => {
                    suffix_indices_list.extend(inputs.iter());
                }
                (None, Some(children)) => {
                    stack.extend(children.values().map(|&child| &self.cursor.tree.arena[child]));
                }
                (None, None) => unreachable!("Node must have either inputs or children") // Empty node, skip
            }
        }

        suffix_indices_list
    }

    pub fn search_if_match(&mut self, search_string: &[LetterType]) -> bool {
        self.find_end_node(search_string).0
    }
}

#[cfg(test)]
mod tests {
    use crate::suffixtree::node::LetterType;
    use crate::suffixtree::searcher::Searcher;
    use crate::suffixtree::tree::Tree;
    use crate::suffixtree::tree_builder::{TreeBuilder, UkkonenBuilder};

    pub fn str_to_nodes(s: &str) -> Vec<LetterType> {
        s.as_bytes().iter().map(|&b| b as LetterType).collect()
    }

    #[test]
    fn test_simple_search() {
        let input = vec![
            str_to_nodes("ABX$"),
            str_to_nodes("ABC$")
        ];

        let mut tree = Tree::new();
        tree.add_words(&input, UkkonenBuilder::new());
        let mut searcher = Searcher::new(&tree, &input);

        assert!(searcher.search_if_match(str_to_nodes("ABX").as_slice()));
        assert!(searcher.search_if_match(str_to_nodes("ABC").as_slice()));
        let mut result = searcher.find_all_suffix_indices(str_to_nodes("AB").as_slice());
        result.sort();
        assert_eq!(result, vec![0, 1]);
    }

    #[test]
    fn test_no_match_between_inputs() {
        let input = vec![
            str_to_nodes("ABC$"),
            str_to_nodes("ABD$"),
            str_to_nodes("ABE$")
        ];

        let mut tree = Tree::new();
        tree.add_words(&input, UkkonenBuilder::new());
        let mut searcher = Searcher::new(&tree, &input);

        assert!(!searcher.search_if_match(str_to_nodes("CA").as_slice()));
        assert!(!searcher.search_if_match(str_to_nodes("DA").as_slice()));
        assert!(!searcher.search_if_match(str_to_nodes("CABDA").as_slice()));
    }

    #[test]
    fn test_suffix_indices_equal_input() {
        let input = vec![
            str_to_nodes("ABC$"),
            str_to_nodes("ABC$")
        ];

        let mut tree = Tree::new();
        tree.add_words(&input, UkkonenBuilder::new());
        let mut searcher = Searcher::new(&tree, &input);

        for i in 0..str_to_nodes("ABC$").len() {
            let mut result = searcher.find_all_suffix_indices(&str_to_nodes("ABC$")[i..]);
            result.sort();
            
            assert_eq!(result, vec![0, 1]);
        }
    }
}