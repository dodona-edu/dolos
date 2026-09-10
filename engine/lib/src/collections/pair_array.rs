use crate::collections::utils::ordered_pair;

/// A symmetric pair array that stores values for pairs (i, j) where i < j.
#[derive(Debug)]
pub struct PairArray<T> {
    data: Vec<T>,
    /// The number of items being pairwise matched. For `n` items there are
    /// `n * (n - 1) / 2` unique unordered pairs stored in `data`.
    item_count: usize,
}

impl<T: Clone> PairArray<T> {
    /// Creates a new `PairArray` for `item_count` items, initializing every
    /// pair's value to `default`. For `n` items there are `n * (n - 1) / 2`
    /// unique unordered pairs stored.
    pub fn new(item_count: usize, default: T) -> Self {
        Self { data: vec![default; pair_count(item_count)], item_count }
    }

    /// Creates a `PairArray` from a pre-initialized vector.
    /// The vector must have exactly `item_count * (item_count - 1) / 2` values.
    pub fn from_vec(data: Vec<T>, item_count: usize) -> Self {
        debug_assert_eq!(data.len(), pair_count(item_count), "Data size mismatch");
        Self { data, item_count }
    }

    /// Converts pair indices to linear index.
    #[inline]
    fn index(&self, i: usize, j: usize) -> usize {
        debug_assert_ne!(i, j);
        debug_assert!(i < self.item_count, "Invalid input index 1");
        debug_assert!(j < self.item_count, "Invalid input index 2");
        let (min, max) = ordered_pair(i, j);
        // Formula for upper triangular index
        min * (2 * self.item_count - min - 1) / 2 + (max - min - 1)
    }

    /// Returns the value at position (i, j).
    pub fn get(&self, i: usize, j: usize) -> &T {
        &self.data[self.index(i, j)]
    }

    /// Returns a mutable reference to the value at position (i, j).
    pub fn get_mut(&mut self, i: usize, j: usize) -> &mut T {
        let idx = self.index(i, j);
        &mut self.data[idx]
    }

    /// Sets the value at position (i, j).
    pub fn set(&mut self, i: usize, j: usize, value: T) {
        let idx = self.index(i, j);
        self.data[idx] = value;
    }

    /// Returns the number of items being pairwise matched.
    #[inline]
    pub fn item_count(&self) -> usize {
        self.item_count
    }

    /// Returns the number of stored pairs.
    #[inline]
    pub fn pair_count(&self) -> usize {
        self.data.len()
    }

    /// Returns whether no pair is stored, which is the case for fewer than two
    /// items.
    #[inline]
    pub fn is_empty(&self) -> bool {
        self.data.is_empty()
    }

    /// Returns an iterator over all pairs with their indices.
    pub fn iter_pairs(&self) -> impl Iterator<Item = (usize, usize, &T)> {
        pair_indices(self.item_count)
            .zip(self.data.iter())
            .map(|((i, j), value)| (i, j, value))
    }

    /// Returns an iterator over all pairs with their indices, allowing the
    /// values to be modified.
    pub fn iter_pairs_mut(&mut self) -> impl Iterator<Item = (usize, usize, &mut T)> {
        pair_indices(self.item_count)
            .zip(self.data.iter_mut())
            .map(|((i, j), value)| (i, j, value))
    }
}

/// The number of unordered pairs among `item_count` items.
#[inline]
fn pair_count(item_count: usize) -> usize {
    item_count * item_count.saturating_sub(1) / 2
}

/// The pair indices in storage order: (0,1), (0,2), ..., (1,2), ...
fn pair_indices(item_count: usize) -> impl Iterator<Item = (usize, usize)> {
    (0..item_count).flat_map(move |i| ((i + 1)..item_count).map(move |j| (i, j)))
}

#[cfg(test)]
mod tests {
    use crate::collections::pair_array::PairArray;

    #[test]
    fn fewer_than_two_items_store_no_pair() {
        let arr: PairArray<usize> = PairArray::new(0, 0);
        assert!(arr.is_empty());
        assert_eq!(PairArray::new(1, 0).pair_count(), 0);
    }

    #[test]
    fn iter_pairs_mut_visits_every_pair_in_storage_order() {
        let mut arr = PairArray::new(3, 0);
        for (i, j, value) in arr.iter_pairs_mut() {
            *value = 10 * i + j;
        }

        assert_eq!(
            arr.iter_pairs().map(|(_, _, &v)| v).collect::<Vec<_>>(),
            [1, 2, 12]
        );
    }

    #[test]
    fn symmetric_access_returns_the_same_value() {
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
