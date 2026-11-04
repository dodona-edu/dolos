use std::ops::{Index, IndexMut};

use crate::collections::utils::ordered_pair;

/// A symmetric pair array that stores values for pairs (i, j) where i < j.
///
/// `(i, j)` and `(j, i)` name the same pair.
///
/// # Examples
///
/// ```
/// use dolos_core::PairArray;
///
/// let mut similarities = PairArray::new(3, 0.0);
/// similarities[(0, 2)] = 0.5;
///
/// assert_eq!(similarities[(2, 0)], 0.5);
/// ```
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PairArray<T> {
    data: Vec<T>,
    /// The number of items being pairwise matched. For `n` items there are
    /// `n * (n - 1) / 2` unique unordered pairs stored in `data`.
    item_count: usize,
}

impl<T: Clone> PairArray<T> {
    /// Creates an array for `item_count` items with `default` as the value of
    /// every pair.
    ///
    /// # Parameters
    ///
    /// - `item_count`: the number of items. The array holds
    ///   `item_count * (item_count - 1) / 2` pairs.
    /// - `default`: the start value of every pair.
    ///
    /// # Examples
    ///
    /// ```
    /// use dolos_core::PairArray;
    ///
    /// let counts = PairArray::new(4, 0);
    /// assert_eq!(counts.pair_count(), 6);
    /// ```
    pub fn new(item_count: usize, default: T) -> Self {
        Self { data: vec![default; pair_count(item_count)], item_count }
    }
}

impl<T> PairArray<T> {
    /// Converts pair indices to the linear index, or `None` when (i, j) names
    /// no pair.
    #[inline]
    fn index(&self, i: usize, j: usize) -> Option<usize> {
        if i == j || i >= self.item_count || j >= self.item_count {
            return None;
        }
        let (min, max) = ordered_pair(i, j);
        // Formula for upper triangular index
        Some(min * (2 * self.item_count - min - 1) / 2 + (max - min - 1))
    }

    /// Returns the value of the pair of items `i` and `j`, or `None` when
    /// `i == j` or when `i` or `j` is not below [`item_count`](Self::item_count).
    ///
    /// The order of `i` and `j` does not matter.
    ///
    /// # Parameters
    ///
    /// - `i`, `j`: two item indices.
    ///
    /// # Examples
    ///
    /// ```
    /// # use dolos_core::{AnalysisOptions, analyze};
    /// # let options = AnalysisOptions { min_match_length: 1, keep_matches: false };
    /// let result = analyze(&[vec![1, 2], vec![1, 2], vec![3]], None, &options)?;
    ///
    /// assert_eq!(result.metrics().get(0, 1).map(|m| m.longest_match), Some(2));
    /// assert_eq!(result.metrics().get(1, 0).map(|m| m.longest_match), Some(2));
    /// assert_eq!(result.metrics().get(1, 1), None);
    /// # Ok::<(), std::io::Error>(())
    /// ```
    pub fn get(&self, i: usize, j: usize) -> Option<&T> {
        self.index(i, j).map(|idx| &self.data[idx])
    }

    /// Returns a mutable reference to the value of the pair of items `i` and
    /// `j`, or `None` when `i == j` or when `i` or `j` is not below
    /// [`item_count`](Self::item_count).
    ///
    /// The order of `i` and `j` does not matter.
    ///
    /// # Parameters
    ///
    /// - `i`, `j`: two item indices.
    ///
    /// # Examples
    ///
    /// ```
    /// use dolos_core::PairArray;
    ///
    /// let mut counts = PairArray::new(3, 0);
    /// if let Some(count) = counts.get_mut(2, 1) {
    ///     *count += 1;
    /// }
    ///
    /// assert_eq!(counts[(1, 2)], 1);
    /// assert_eq!(counts.get_mut(3, 1), None);
    /// ```
    pub fn get_mut(&mut self, i: usize, j: usize) -> Option<&mut T> {
        self.index(i, j).map(|idx| &mut self.data[idx])
    }

    /// Returns the number of items. For an analysis, this is the number of
    /// sequences.
    ///
    /// # Examples
    ///
    /// ```
    /// # use dolos_core::{AnalysisOptions, analyze};
    /// # let options = AnalysisOptions { min_match_length: 1, keep_matches: false };
    /// let result = analyze(&[vec![1, 2], vec![1, 2], vec![3]], None, &options)?;
    ///
    /// assert_eq!(result.metrics().item_count(), 3);
    /// # Ok::<(), std::io::Error>(())
    /// ```
    #[inline]
    pub fn item_count(&self) -> usize {
        self.item_count
    }

    /// Returns the number of pairs: `n * (n - 1) / 2` for `n` items.
    ///
    /// # Examples
    ///
    /// ```
    /// # use dolos_core::{AnalysisOptions, analyze};
    /// # let options = AnalysisOptions { min_match_length: 1, keep_matches: false };
    /// let result = analyze(&[vec![1, 2], vec![1, 2], vec![3]], None, &options)?;
    ///
    /// assert_eq!(result.metrics().pair_count(), 3);
    /// # Ok::<(), std::io::Error>(())
    /// ```
    #[inline]
    pub fn pair_count(&self) -> usize {
        self.data.len()
    }

    /// Returns `true` when the array holds no pair, which is the case for fewer
    /// than two items. An array from [`analyze`](crate::analyze) is never
    /// empty, because `analyze` needs at least two sequences.
    #[inline]
    pub fn is_empty(&self) -> bool {
        self.data.is_empty()
    }

    /// Returns an iterator over all pairs as `(i, j, value)` with `i < j`.
    ///
    /// The pairs come in the order `(0, 1)`, `(0, 2)`, ..., `(1, 2)`, ...
    ///
    /// # Examples
    ///
    /// ```
    /// # use dolos_core::{AnalysisOptions, analyze};
    /// # let options = AnalysisOptions { min_match_length: 1, keep_matches: false };
    /// let result = analyze(&[vec![1, 2], vec![1, 2], vec![3]], None, &options)?;
    ///
    /// let pairs: Vec<_> = result.metrics().iter_pairs().map(|(i, j, _)| (i, j)).collect();
    /// assert_eq!(pairs, [(0, 1), (0, 2), (1, 2)]);
    /// # Ok::<(), std::io::Error>(())
    /// ```
    pub fn iter_pairs(&self) -> impl Iterator<Item = (usize, usize, &T)> {
        pair_indices(self.item_count)
            .zip(self.data.iter())
            .map(|((i, j), value)| (i, j, value))
    }

    /// Returns an iterator over all pairs as `(i, j, value)` with `i < j`, and
    /// consumes the array.
    ///
    /// The pairs come in the same order as in [`iter_pairs`](Self::iter_pairs).
    ///
    /// # Examples
    ///
    /// ```
    /// use dolos_core::PairArray;
    ///
    /// let names = PairArray::new(3, String::from("pair"));
    /// let owned: Vec<(usize, usize, String)> = names.into_iter_pairs().collect();
    ///
    /// assert_eq!(owned[2], (1, 2, String::from("pair")));
    /// ```
    pub fn into_iter_pairs(self) -> impl Iterator<Item = (usize, usize, T)> {
        pair_indices(self.item_count)
            .zip(self.data)
            .map(|((i, j), value)| (i, j, value))
    }

    /// Returns a new array with the result of `f` for every pair.
    ///
    /// # Parameters
    ///
    /// - `f`: called once per pair with `(i, j, value)`, where `i < j`.
    ///
    /// # Examples
    ///
    /// ```
    /// use dolos_core::PairArray;
    ///
    /// let mut counts = PairArray::new(3, 1);
    /// counts[(0, 2)] = 4;
    ///
    /// let doubled = counts.map(|_, _, &count| count * 2);
    /// assert_eq!(doubled[(0, 2)], 8);
    /// assert_eq!(doubled[(0, 1)], 2);
    /// ```
    pub fn map<U>(&self, mut f: impl FnMut(usize, usize, &T) -> U) -> PairArray<U> {
        PairArray {
            data: self
                .iter_pairs()
                .map(|(i, j, value)| f(i, j, value))
                .collect(),
            item_count: self.item_count,
        }
    }

    /// Returns an iterator over all pairs as `(i, j, value)` with `i < j`, with
    /// a mutable reference to each value.
    ///
    /// The pairs come in the same order as in [`iter_pairs`](Self::iter_pairs).
    ///
    /// # Examples
    ///
    /// ```
    /// use dolos_core::PairArray;
    ///
    /// let mut distances = PairArray::new(3, 0);
    /// for (i, j, distance) in distances.iter_pairs_mut() {
    ///     *distance = j - i;
    /// }
    ///
    /// assert_eq!(distances[(0, 2)], 2);
    /// ```
    pub fn iter_pairs_mut(&mut self) -> impl Iterator<Item = (usize, usize, &mut T)> {
        pair_indices(self.item_count)
            .zip(self.data.iter_mut())
            .map(|((i, j), value)| (i, j, value))
    }
}

/// Returns the value of the pair `(i, j)`.
///
/// # Panics
///
/// Panics when `i == j`, or when `i` or `j` is not below
/// [`item_count`](PairArray::item_count).
impl<T> Index<(usize, usize)> for PairArray<T> {
    type Output = T;

    fn index(&self, (i, j): (usize, usize)) -> &T {
        self.get(i, j).expect("i and j name a pair")
    }
}

/// Returns a mutable reference to the value of the pair `(i, j)`.
///
/// # Panics
///
/// Panics when `i == j`, or when `i` or `j` is not below
/// [`item_count`](PairArray::item_count).
impl<T> IndexMut<(usize, usize)> for PairArray<T> {
    fn index_mut(&mut self, (i, j): (usize, usize)) -> &mut T {
        self.get_mut(i, j).expect("i and j name a pair")
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
    use super::*;

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
    fn map_keeps_every_pair_at_its_indices() {
        let mut arr = PairArray::new(3, 0);
        arr[(1, 2)] = 5;

        let mapped = arr.map(|i, j, &value| (i, j, value * 2));

        assert_eq!(mapped.get(2, 1), Some(&(1, 2, 10)));
    }

    #[test]
    fn into_iter_pairs_yields_every_pair_in_storage_order() {
        let arr = PairArray::new(3, 0);

        assert_eq!(
            arr.into_iter_pairs()
                .map(|(i, j, _)| (i, j))
                .collect::<Vec<_>>(),
            [(0, 1), (0, 2), (1, 2)]
        );
    }

    #[test]
    fn both_index_orders_return_the_same_value() {
        let mut arr = PairArray::new(4, 0);
        arr[(0, 2)] = 20;
        arr[(2, 3)] = 40;

        assert_eq!(arr.get(0, 2), Some(&20));
        assert_eq!(arr.get(2, 0), Some(&20));
        assert_eq!(arr.get(3, 2), Some(&40));
    }

    // Pairs (1, 3) and (2, 3) hold a value, so an index that maps to them shows up.
    #[test]
    fn indices_that_name_no_pair_return_none() {
        let mut arr = PairArray::new(4, 0);
        arr[(1, 3)] = 13;
        arr[(2, 3)] = 23;

        assert_eq!(arr.get(2, 2), None);
        assert_eq!(arr.get(1, 4), None);
        assert_eq!(arr.get(4, 1), None);
        assert_eq!(arr.get_mut(2, 2), None);
    }
}
