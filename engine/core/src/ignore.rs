//! Which positions to leave out of an analysis.
//!
//! The caller passes a list of ranges per sequence. Deciding *which* positions
//! to ignore is the caller's business because it depends on what the symbols
//! mean. [`analyze`](crate::analyze) packs that list into the bit-vectors the
//! analysis reads while it collects matches.

use crate::collections::vec_bitmap::VecBitmap;
use std::ops::Range;

/// Pack the ranges of `ignored` into one bit-vector per sequence, sized by
/// `lengths`. Nothing ignored means no bit-vector at all.
pub(crate) fn ignore_ranges_to_mask(
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
