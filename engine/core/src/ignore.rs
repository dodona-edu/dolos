//! The positions to leave out of an analysis, as one bit-vector per sequence.

use crate::collections::vec_bitmap::VecBitmap;
use std::ops::Range;

/// Pack the ranges of `ignored` into one bit-vector per sequence, sized by
/// `lengths`. Nothing ignored means no bit-vector at all.
pub fn ignore_ranges_to_mask(
    ignored: &[Vec<Range<usize>>],
    lengths: &[usize],
) -> Option<VecBitmap> {
    let mut mask: Option<VecBitmap> = None;

    for (sequence, ranges) in ignored.iter().enumerate() {
        for range in ranges {
            mask.get_or_insert_with(|| VecBitmap::new(lengths))
                .item_mut(sequence)
                .mark(range.start, range.end - range.start);
        }
    }

    mask
}
