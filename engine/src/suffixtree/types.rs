/// Sentinel symbol used to mark the end of input sequences.
pub const SENTINEL_SYMBOL: SymbolType = usize::MAX;

/// Type that represents the index of a node in the arena part of the tree.
pub type NodeIndex = usize;

/// Type that represents a single symbol in the input sequences.
pub type SymbolType = usize;
