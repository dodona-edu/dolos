/// Order a pair of indices so the smaller comes first.
///
/// Returns `(min, max)` such that `min <= max`.
#[inline]
pub fn ordered_pair(i: usize, j: usize) -> (usize, usize) {
    if i < j { (i, j) } else { (j, i) }
}

/// Order a pair of indices so the smaller comes first, carrying along
/// associated values in the same order.
///
/// Given indices `(i, j)` with associated values `(vi, vj)`, returns
/// `(min_idx, max_idx, val_of_min, val_of_max)`.
#[inline]
pub fn ordered_pair_with<T>(i: usize, j: usize, vi: T, vj: T) -> (usize, usize, T, T) {
    if i < j {
        (i, j, vi, vj)
    } else {
        (j, i, vj, vi)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ordered_pair_already_sorted() {
        assert_eq!(ordered_pair(1, 3), (1, 3));
    }

    #[test]
    fn ordered_pair_reversed() {
        assert_eq!(ordered_pair(5, 2), (2, 5));
    }

    #[test]
    fn ordered_pair_equal() {
        assert_eq!(ordered_pair(4, 4), (4, 4));
    }

    #[test]
    fn ordered_pair_with_already_sorted() {
        assert_eq!(ordered_pair_with(0, 1, 10, 20), (0, 1, 10, 20));
    }

    #[test]
    fn ordered_pair_with_reversed() {
        assert_eq!(ordered_pair_with(3, 1, 30, 10), (1, 3, 10, 30));
    }
}
