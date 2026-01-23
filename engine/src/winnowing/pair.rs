use std::cmp::Ordering;
use std::collections::HashMap;
use std::rc::Rc;

use crate::file::File;
use crate::winnowing::hashes::Hash;
use crate::winnowing::shared_fingerprint::SharedFingerprint;
use crate::winnowing::tokens::Fingerprint;

#[derive(Debug)]
pub struct Pair {
    pub left_file: Rc<File>,
    pub right_file: Rc<File>,
    pub overlap: usize,
    pub longest: usize,
    pub similarity: f64,
    pub right: usize,
    pub left: usize,
}

impl PartialEq for Pair {
    fn eq(&self, other: &Self) -> bool {
        self.left_file == other.left_file && self.right_file == other.right_file
    }
}

impl Eq for Pair {}

impl PartialOrd for Pair {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for Pair {
    fn cmp(&self, other: &Self) -> Ordering {
        other
            .similarity
            .total_cmp(&self.similarity)
            .then_with(|| self.left_file.cmp(&other.left_file))
            .then_with(|| self.right_file.cmp(&other.right_file))
    }
}


impl Pair {
    pub fn new(left_file: &Rc<File>, right_file: &Rc<File>, fingerprints: &HashMap<Hash, SharedFingerprint>) -> Self {

        let shared: Vec<Hash> = left_file
            .shared
            .intersection(&right_file.shared)
            .cloned()
            .collect();


        let mut left = Vec::new();
        let mut right = Vec::new();
        for shared_hash in shared.iter() {
            let sf = fingerprints.get(shared_hash).expect("Fingerprint should exist");

            left.append(&mut sf.parts.get(left_file).expect("File should exist").iter().map(|occ| occ.fingerprint.clone()).collect::<Vec<Fingerprint>>());
            right.append(&mut sf.parts.get(right_file).expect("File should exist").iter().map(|occ| occ.fingerprint.clone()).collect::<Vec<Fingerprint>>());
        }

        left.sort_by(|a, b| a.index.cmp(&b.index));
        right.sort_by(|a, b| a.index.cmp(&b.index));

        let overlap = left.len() + right.len();
        let longest = Self::longest_common_substring(&left, &right);
        let denominator = left_file.fingerprints.len() + right_file.fingerprints.len();
        let similarity = if overlap == 0 { 0.0 } else { overlap as f64 / denominator as f64 };

        Pair {
            left_file: left_file.clone(),
            right_file: right_file.clone(),
            overlap,
            longest,
            similarity,
            right: right.len(),
            left: left.len(),
        }
    }

    fn longest_common_substring(l: &Vec<Fingerprint>, r: &Vec<Fingerprint>) -> usize {
        if l.is_empty() || r.is_empty() {
            return 0;
        }

        let (short, long) = if l.len() < r.len() {
            (l, r)
        } else {
            (r, l)
        };

        let mut longest = 0;
        let mut prev_l_item: Option<&Fingerprint> = None;
        let mut prev_s_item: Option<&Fingerprint> = None;
        let mut prev_row: Vec<usize> = vec![0; short.len() + 1];
        let mut curr_row: Vec<usize> = vec![0; short.len() + 1];

        for l_item in long {
            for i in 1..=short.len() {
                let s_item = &short[i - 1];

                if l_item.hash == s_item.hash {
                    let can_extend = matches!(
                        (prev_l_item, prev_s_item),
                        (Some(p_l), Some(p_s)) if prev_row[i - 1] > 0 && l_item.index == p_l.index + 1 && s_item.index == p_s.index + 1
                    );

                    if can_extend {
                        curr_row[i] = prev_row[i - 1] + 1;
                    } else {
                        curr_row[i] = 1;
                    }

                    if curr_row[i] > longest {
                        longest = curr_row[i];
                    }
                }

                prev_s_item = Some(s_item);
            }

            prev_l_item = Some(l_item);
            prev_s_item = None;
            std::mem::swap(&mut prev_row, &mut curr_row);
        }

        longest
    }
}


#[cfg(test)]
mod tests {
    use crate::winnowing::pair::Pair;
    use crate::winnowing::tokens::Fingerprint;

    #[test]
    fn test_longest_common_substring_small() {
        let vec1 = vec![
            Fingerprint { index: 2, hash: 0 },
            Fingerprint { index: 3, hash: 5 },
            Fingerprint { index: 4, hash: 20 }
        ];
        let vec2 = vec![
            Fingerprint { index: 0, hash: 0 },
            Fingerprint { index: 1, hash: 5 },
            Fingerprint { index: 2, hash: 20 }
        ];
        assert_eq!(Pair::longest_common_substring(&vec1, &vec2), 3);
        assert_eq!(Pair::longest_common_substring(&vec2, &vec1), 3);
    }

    #[test]
    fn test_longest_common_substring_empty() {
        let vec1 = vec![];
        let vec2 = vec![];
        let vec3 = vec![
            Fingerprint { index: 0, hash: 0 },
            Fingerprint { index: 1, hash: 5 },
            Fingerprint { index: 2, hash: 20 }
        ];
        assert_eq!(Pair::longest_common_substring(&vec1, &vec2), 0);
        assert_eq!(Pair::longest_common_substring(&vec1, &vec3), 0);
        assert_eq!(Pair::longest_common_substring(&vec3, &vec1), 0);
    }

    #[test]
    fn test_longest_common_substring_jump_index() {
        let vec1 = vec![
            Fingerprint { index: 2, hash: 0 },
            Fingerprint { index: 3, hash: 5 },
            Fingerprint { index: 10, hash: 20 }
        ];
        let vec2 = vec![
            Fingerprint { index: 0, hash: 0 },
            Fingerprint { index: 1, hash: 5 },
            Fingerprint { index: 2, hash: 20 }
        ];
        assert_eq!(Pair::longest_common_substring(&vec1, &vec2), 2);
        assert_eq!(Pair::longest_common_substring(&vec2, &vec1), 2);
    }

    #[test]
    fn test_longest_common_substring_medium() {
        let vec1 = vec![
            Fingerprint { index: 2, hash: 100 },
            Fingerprint { index: 3, hash: 200 },
            Fingerprint { index: 10, hash: 300 },
            Fingerprint { index: 200, hash: 0 },
            Fingerprint { index: 201, hash: 1 },
            Fingerprint { index: 202, hash: 2 },
            Fingerprint { index: 203, hash: 3 },
            Fingerprint { index: 400, hash: 400 },
            Fingerprint { index: 500, hash: 500 },
        ];
        let vec2 = vec![
            Fingerprint { index: 2, hash: 101 },
            Fingerprint { index: 3, hash: 201 },
            Fingerprint { index: 10, hash: 301 },
            Fingerprint { index: 300, hash: 0 },
            Fingerprint { index: 301, hash: 1 },
            Fingerprint { index: 302, hash: 2 },
            Fingerprint { index: 303, hash: 3 },
            Fingerprint { index: 400, hash: 401 },
            Fingerprint { index: 500, hash: 501 },
        ];
        assert_eq!(Pair::longest_common_substring(&vec1, &vec2), 4);
        assert_eq!(Pair::longest_common_substring(&vec2, &vec1), 4);
    }
}
