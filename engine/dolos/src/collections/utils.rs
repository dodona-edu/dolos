/// Order a pair of indices so the smaller comes first.
///
/// Returns `(min, max)` such that `min <= max`.
#[inline]
pub fn ordered_pair(a: usize, b: usize) -> (usize, usize) {
    if a < b { (a, b) } else { (b, a) }
}

/// Order a pair of indices so the smaller comes first, carrying along
/// associated values in the same order.
///
/// Given indices `(a, b)` with associated values `(va, vb)`, returns
/// `(min_idx, max_idx, val_of_min, val_of_max)`.
#[inline]
pub fn ordered_pair_with<T>(a: usize, b: usize, va: T, vb: T) -> (usize, usize, T, T) {
    if a < b {
        (a, b, va, vb)
    } else {
        (b, a, vb, va)
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
