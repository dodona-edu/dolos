use crate::suffixtree::Match;
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
    /// Whether this fragment comes from an ignored or too-common substring.
    ///
    /// Ignored fragments are excluded from similarity and `longest_fragment`
    /// metrics but are still reported so callers can inspect or visualise them.
    pub ignored: bool,
}

impl Fragment {
    /// Resolve a raw [`Match`] into a [`Fragment`] using per-file fingerprint
    /// location arrays.
    pub fn resolve(m: &Match, left_locs: &[Region], right_locs: &[Region]) -> Self {
        Fragment {
            left_region: Region::span(
                &left_locs[m.left_start],
                &left_locs[m.left_start + m.length - 1],
            ),
            right_region: Region::span(
                &right_locs[m.right_start],
                &right_locs[m.right_start + m.length - 1],
            ),
            fingerprint_count: m.length,
            ignored: m.ignored,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::winnowing::region::Point;

    #[test]
    fn resolve_maps_match_to_regions() {
        let left_locs = vec![
            Region::new(Point::new(10, 0), Point::new(10, 10)),
            Region::new(Point::new(11, 0), Point::new(12, 12)),
        ];
        let right_locs = vec![
            Region::new(Point::new(20, 0), Point::new(20, 10)),
            Region::new(Point::new(21, 0), Point::new(22, 12)),
        ];
        let m = Match { left_start: 0, right_start: 0, length: 2, ignored: false };

        let frag = Fragment::resolve(&m, &left_locs, &right_locs);

        let expected_left_region = Region::new(Point::new(10, 0), Point::new(12, 12));
        let expected_right_region = Region::new(Point::new(20, 0), Point::new(22, 12));

        assert_eq!(frag.left_region, expected_left_region);
        assert_eq!(frag.right_region, expected_right_region);
        assert_eq!(frag.fingerprint_count, 2);
        assert!(!frag.ignored);
    }

    #[test]
    fn resolve_propagates_ignored_flag() {
        let left_locs = vec![Region::new(Point::new(0, 0), Point::new(0, 5))];
        let right_locs = vec![Region::new(Point::new(1, 0), Point::new(1, 5))];
        let m = Match { left_start: 0, right_start: 0, length: 1, ignored: true };

        let frag = Fragment::resolve(&m, &left_locs, &right_locs);

        assert!(frag.ignored);
    }
}
