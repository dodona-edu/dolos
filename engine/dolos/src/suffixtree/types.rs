/// Sentinel symbol used to mark the end of words.
pub(crate) const SENTINEL_SYMBOL: SymbolType = usize::MAX;

/// Type that represents the index of a node in the arena part of the tree.
pub(super) type NodeIndex = usize;

/// Type that represents a single symbol in a word.
pub(super) type SymbolType = usize;
