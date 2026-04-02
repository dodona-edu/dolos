use crate::suffixtree::types::Match;
use crate::winnowing::region::Region;

/// A resolved code fragment: the source regions that correspond to one
/// maximal exact match in both files.
#[derive(Debug, Clone)]
pub struct Fragment {
    /// The region in the left file covered by this match.
    pub left_region: Region,
    /// The region in the right file covered by this match.
    pub right_region: Region,
    /// Number of fingerprints in this match.
    pub fingerprint_count: usize,
}

impl Fragment {
    /// Resolve a raw [`Match`] into a [`Fragment`] using per-file fingerprint
    /// location arrays.
    pub(crate) fn resolve(
        m: &Match,
        left_idx: usize,
        right_idx: usize,
        left_locs: &[Region],
        right_locs: &[Region],
    ) -> Self {
        let (left_pos, right_pos) = if m.pos1.word_index == left_idx {
            debug_assert_eq!(m.pos1.word_index, left_idx);
            debug_assert_eq!(m.pos2.word_index, right_idx);
            (&m.pos1, &m.pos2)
        } else {
            debug_assert_eq!(m.pos2.word_index, left_idx);
            debug_assert_eq!(m.pos1.word_index, right_idx);
            (&m.pos2, &m.pos1)
        };

        Fragment {
            left_region: Region::span(
                &left_locs[left_pos.start],
                &left_locs[left_pos.start + m.length - 1],
            ),
            right_region: Region::span(
                &right_locs[right_pos.start],
                &right_locs[right_pos.start + m.length - 1],
            ),
            fingerprint_count: m.length,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::suffixtree::types::StartPosition;
    use crate::winnowing::region::Point;

    #[test]
    fn resolve_swapped_word_indices() {
        // word_index 1 is the "left" file and word_index 0 is the "right" file,
        // so pos1/pos2 are intentionally swapped relative to the left/right
        let left_locs = vec![
            Region::new(210, 220, Point::new(10, 0), Point::new(10, 10)),
            Region::new(221, 234, Point::new(11, 0), Point::new(12, 12)),
        ];
        let right_locs = vec![
            Region::new(420, 430, Point::new(20, 0), Point::new(20, 10)),
            Region::new(431, 444, Point::new(21, 0), Point::new(22, 12)),
        ];
        let m = Match::new(
            StartPosition { word_index: 1, start: 0 },
            StartPosition { word_index: 0, start: 0 },
            2,
        );

        let frag = Fragment::resolve(&m, 0, 1, &left_locs, &right_locs);

        let expected_left_region = Region::new(210, 234, Point::new(10, 0), Point::new(12, 12));
        let expected_right_region = Region::new(420, 444, Point::new(20, 0), Point::new(22, 12));

        assert_eq!(frag.left_region, expected_left_region);
        assert_eq!(frag.right_region, expected_right_region);
        assert_eq!(frag.fingerprint_count, 2);
    }
}
