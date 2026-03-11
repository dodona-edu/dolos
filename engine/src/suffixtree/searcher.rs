use crate::suffixtree::node::Node;
use crate::suffixtree::search_cursor::SearchCursor;
use crate::suffixtree::suffixtree::SuffixTree;
use crate::suffixtree::types::SymbolType;

/// Provides methods for searching patterns in the suffix tree.
pub struct Searcher<'a> {
    cursor: SearchCursor<'a>,
    original_input_string: &'a [Vec<SymbolType>],
}

impl<'a> Searcher<'a> {
    /// Creates a new `Searcher` for the given suffix tree and input sequences.
    pub fn new(tree: &'a SuffixTree, original_input_string: &'a [Vec<SymbolType>]) -> Self {
        Self {
            cursor: SearchCursor::new(tree),
            original_input_string,
        }
    }

    /// Searches for the pattern in the suffix tree and returns the end node if found.
    /// Returns `Some(node)` if the pattern exists in the tree, `None` otherwise.
    fn search_pattern(&mut self, search_string: &[SymbolType]) -> Option<&'a Node> {
        if search_string.is_empty() {
            return Some(&self.cursor.tree.arena[0]);
        }

        let mut index_in_string: usize = 0;
        while index_in_string < search_string.len()
            && self
                .cursor
                .next(search_string[index_in_string], self.original_input_string)
        {
            index_in_string += 1;
        }

        let result = if index_in_string == search_string.len() {
            Some(self.cursor.current_node)
        } else {
            None
        };

        self.cursor.reset();
        result
    }

    /// Checks if the suffix tree contains the given pattern.
    pub fn contains(&mut self, search_string: &[SymbolType]) -> bool {
        self.search_pattern(search_string).is_some()
    }

    /// Finds all indices where the given pattern occurs in the input sequences.
    pub fn find_all_suffix_indices(&mut self, search_string: &[SymbolType]) -> Vec<usize> {
        let Some(end_node) = self.search_pattern(search_string) else {
            return vec![];
        };

        let mut suffix_indices_list = Vec::new();
        let mut stack = vec![end_node];

        while let Some(current_node) = stack.pop() {
            match (&current_node.inputs, &current_node.children) {
                (Some(inputs), _) => {
                    suffix_indices_list.extend(inputs.iter());
                }
                (None, Some(children)) => {
                    stack.extend(
                        children
                            .values()
                            .map(|&child| &self.cursor.tree.arena[child]),
                    );
                }
                (None, None) => unreachable!("Node must have either inputs or children"), // Empty node, skip
            }
        }

        suffix_indices_list
    }
}

#[cfg(test)]
mod tests {
    use crate::suffixtree::searcher::Searcher;
    use crate::suffixtree::suffixtree::SuffixTree;
    use crate::suffixtree::types::SymbolType;

    pub fn str_to_nodes(s: &str) -> Vec<SymbolType> {
        s.as_bytes().iter().map(|&b| b as SymbolType).collect()
    }

    #[test]
    fn test_simple_search() {
        let input = vec![str_to_nodes("ABX$"), str_to_nodes("ABC$")];

        let tree = SuffixTree::new(&input);
        let mut searcher = Searcher::new(&tree, &input);

        assert!(searcher.contains(str_to_nodes("ABX").as_slice()));
        assert!(searcher.contains(str_to_nodes("ABC").as_slice()));
        let mut result = searcher.find_all_suffix_indices(str_to_nodes("AB").as_slice());
        result.sort();
        assert_eq!(result, vec![0, 1]);
    }

    #[test]
    fn test_no_match_between_inputs() {
        let input = vec![
            str_to_nodes("ABC$"),
            str_to_nodes("ABD$"),
            str_to_nodes("ABE$"),
        ];

        let tree = SuffixTree::new(&input);
        let mut searcher = Searcher::new(&tree, &input);

        assert!(!searcher.contains(str_to_nodes("CA").as_slice()));
        assert!(!searcher.contains(str_to_nodes("DA").as_slice()));
        assert!(!searcher.contains(str_to_nodes("CABDA").as_slice()));
    }

    #[test]
    fn test_suffix_indices_equal_input() {
        let input = vec![str_to_nodes("ABC$"), str_to_nodes("ABC$")];

        let tree = SuffixTree::new(&input);
        let mut searcher = Searcher::new(&tree, &input);

        for i in 0..str_to_nodes("ABC$").len() {
            let mut result = searcher.find_all_suffix_indices(&str_to_nodes("ABC$")[i..]);
            result.sort();

            assert_eq!(result, vec![0, 1]);
        }
    }
}
