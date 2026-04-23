use crate::collections::utils::ordered_pair;

/// A symmetric pair array that stores values for pairs (i, j) where i < j.
#[derive(Debug)]
pub struct PairArray<T> {
    data: Vec<T>,
    /// The number of elements being pairwise matched. For `n` elements there
    /// are `n * (n - 1) / 2` unique unordered pairs stored in `data`.
    size: usize,
}

impl<T: Clone> PairArray<T> {
    /// Creates a new `PairArray` for `size` elements, initializing every pair's
    /// value to `default`. `size` is the number of elements being pairwise
    /// matched. For `n` elements there are `n * (n - 1) / 2` unique unordered pairs
    /// stored.
    pub fn new(size: usize, default: T) -> Self {
        let data_size = size * (size - 1) / 2;
        Self { data: vec![default; data_size], size }
    }

    /// Creates a `PairArray` from a pre-initialized vector.
    /// The vector must have exactly `size * (size - 1) / 2` elements.
    pub fn from_vec(data: Vec<T>, size: usize) -> Self {
        debug_assert_eq!(data.len(), size * (size - 1) / 2, "Data size mismatch");
        Self { data, size }
    }

    /// Converts pair indices to linear index.
    #[inline]
    fn index(&self, i1: usize, i2: usize) -> usize {
        assert_ne!(i1, i2);
        assert!(i1 < self.size, "Invalid input index 1");
        assert!(i2 < self.size, "Invalid input index 2");
        let (min, max) = ordered_pair(i1, i2);
        // Formula for upper triangular index
        min * (2 * self.size - min - 1) / 2 + (max - min - 1)
    }

    /// Returns the value at position (i1, i2).
    pub fn get(&self, i1: usize, i2: usize) -> &T {
        &self.data[self.index(i1, i2)]
    }

    /// Returns a mutable reference to the value at position (i1, i2).
    pub fn get_mut(&mut self, i1: usize, i2: usize) -> &mut T {
        let idx = self.index(i1, i2);
        &mut self.data[idx]
    }

    /// Sets the value at position (i1, i2).
    pub fn set(&mut self, i1: usize, i2: usize, value: T) {
        let idx = self.index(i1, i2);
        self.data[idx] = value;
    }

    /// Returns the number of elements being pairwise matched.
    #[inline]
    pub fn size(&self) -> usize {
        self.size
    }

    /// Returns an iterator over all pairs with their indices.
    pub fn iter_pairs(&self) -> impl Iterator<Item = (usize, usize, &T)> {
        (0..self.size).flat_map(move |i| ((i + 1)..self.size).map(move |j| (i, j, self.get(i, j))))
    }
}

#[cfg(test)]
mod tests {
    use crate::collections::pair_array::PairArray;

    #[test]
    fn test_pair_array() {
        let mut arr = PairArray::new(4, 0);
        arr.set(0, 1, 10);
        arr.set(0, 2, 20);
        arr.set(1, 2, 30);
        arr.set(2, 3, 40);

        assert_eq!(*arr.get(0, 1), 10);
        assert_eq!(*arr.get(1, 0), 10); // Symmetric access
        assert_eq!(*arr.get(0, 2), 20);
        assert_eq!(*arr.get(2, 0), 20);
        assert_eq!(*arr.get(1, 2), 30);
        assert_eq!(*arr.get(2, 3), 40);
    }
}
