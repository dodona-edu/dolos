use std::collections::{HashMap, HashSet};
use std::rc::Rc;

use crate::file::File;
use crate::winnowing::fragment::Fragment;
use crate::winnowing::index::Occurrence;

#[derive(Debug)]
pub struct Pair {
    pub left: Rc<File>,
    pub right: Rc<File>,
    by_start: HashMap<(usize, usize), Rc<Fragment>>,
    by_end: HashMap<(usize, usize), Rc<Fragment>>,
}

impl Pair {
    pub fn new(left: &Rc<File>, right: &Rc<File>) -> Self {
        Pair {
            left: left.clone(),
            right: right.clone(),
            by_start: HashMap::new(),
            by_end: HashMap::new(),
        }
    }

    /// Add all occurences of a kgram within this pair of files
    pub fn add(&mut self, left: &Vec<Occurrence>, right: &Vec<Occurrence>) {
        debug_assert!({
            let hash = left[0].fingerprint.hash;
            left.iter().all(|o| o.fingerprint.hash == hash)
                && right.iter().all(|o| o.fingerprint.hash == hash)
        });

        // TODO:  this is probably optimizable: by having just one fragment for
        // each kgram instead of creating one for each occurrence...
        for lo in left.iter() {
            for ro in right.iter() {
                let start = (lo.fingerprint.index, ro.fingerprint.index);
                let end = (lo.fingerprint.index + 1, ro.fingerprint.index + 1);
                let mut fragment = if let Some(mut existing) = self.remove_by_end(&start) {
                    existing.add_occurrence(lo.clone(), ro.clone());
                    existing
                } else {
                    Fragment {
                        start,
                        end,
                        // TODO: cloning here, this might be an Rc as well?
                        occurrences: (vec![lo.clone()], vec![ro.clone()]),
                    }
                };

                // can we merge with the next fragment?
                if let Some(mut next) = self.remove_by_start(&end) {
                    fragment.extend_with(&mut next);
                }

                self.add_fragment(fragment);
            }
        }
    }

    /// Make this Pair more compact by removing fragments that are contained in a bigger fragment.
    ///
    pub fn squash(&mut self) {
        let fragments: Vec<Fragment> = self.drain_fragments();
        let mut sorted_by_start: Vec<&Fragment> = fragments.iter().collect();
        let mut sorted_by_end: Vec<&Fragment> = fragments.iter().collect();
        sorted_by_start.sort_by_key(|f| f.start.0);
        sorted_by_end.sort_by_key(|f| f.end.0);

        let mut i = 0;
        let mut seen = HashSet::new();
        let mut remove = HashSet::new();
        for fragment in sorted_by_start.iter() {
            if seen.contains(fragment) {
                continue;
            }
            while fragment != &sorted_by_end[i] {
                let candidate = sorted_by_end[i];
                seen.insert(candidate);
                if fragment.start.0 <= candidate.start.0
                    && candidate.end.0 <= fragment.end.0
                    && fragment.start.1 <= candidate.start.1
                    && candidate.end.1 <= fragment.end.1
                {
                    // fragment fully envelops candidate
                    remove.insert(candidate);
                }
                i += 1;
            }
            i += 1;
        }
        for fragment in &fragments {
            if !remove.contains(fragment) {
                self.add_fragment(fragment.clone());
            }
        }
    }

    fn add_fragment(&mut self, fragment: Fragment) {
        let fragment = Rc::new(fragment);
        self.by_start.insert(fragment.start, fragment.clone());
        self.by_end.insert(fragment.end, fragment);
    }

    fn remove_by_start(&mut self, start: &(usize, usize)) -> Option<Fragment> {
        let fragment = self.by_start.remove(&start)?;
        drop(
            self.by_end
                .remove(&fragment.end)
                .expect("Pair::by_start contains a fragment iff Pair::by_end does"),
        );
        Some(
            Rc::try_unwrap(fragment)
                .expect("Pair::by_start contains a fragment iff Pair::by_end does"),
        )
    }

    fn remove_by_end(&mut self, end: &(usize, usize)) -> Option<Fragment> {
        let fragment = self.by_end.remove(&end)?;
        drop(
            self.by_start
                .remove(&fragment.start)
                .expect("Pair::by_start contains a fragment iff Pair::by_end does"),
        );
        Some(
            Rc::try_unwrap(fragment)
                .expect("Pair::by_start contains a fragment iff Pair::by_end does"),
        )
    }

    fn drain_fragments(&mut self) -> Vec<Fragment> {
        self.by_start.clear();
        self.by_end
            .drain()
            .map(|(_k, f)| Rc::try_unwrap(f).unwrap())
            .collect()
    }

    fn fragments<'a>(&'a self) -> Vec<&'a Rc<Fragment>> {
        let mut fragments: Vec<&Rc<Fragment>> = self.by_start.values().collect();
        fragments.sort();
        fragments
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::language::Language;
    use crate::tokenizer::{Token, Tokenizer};
    use crate::winnowing::hashes::hash_token;
    use crate::winnowing::tokens::Fingerprint;

    use tree_sitter::{Point, Range, Tree};

    fn dummy_file(name: &str) -> Rc<File> {
        let mut tokenizer = Tokenizer::new(Language::Javascript);
        let mut file = tokenizer.parse("fixtures/empty.js".into());
        file.path = name.into();
        Rc::new(file)
    }

    fn dummy_fingerprint(name: &str, index: usize) -> Fingerprint {
        Fingerprint {
            index,
            hash: hash_token(name),
            kgram: vec![Token {
                name: name.to_string(),
                range: Range {
                    start_byte: 0,
                    end_byte: 1,
                    start_point: Point { column: 0, row: 0 },
                    end_point: Point { column: 1, row: 1 },
                },
            }],
        }
    }

    fn fragment_name(fragment: &Fragment) -> &str {
        &fragment.occurrences.0[0].fingerprint.kgram[0].name
    }

    // This test creates the following scenario for the fragments of a pair,
    // where the first column is the kgram index in the left and right files and
    // the other columns show the fingerprint (letter) of the fragment matching.
    //
    // idx| Left   | Right
    // ---------------------
    // 0  | A      | D
    //    | A      | D
    // 5  | A B F  | D E F
    //    | A      | D
    // 10 | -      | -
    //    | C      |
    //    | C      |
    //    | C      |
    // 20 | -      | -
    //    | D      | 1   C
    //    | D      | 1   C
    // 25 | D E    | 1 B C
    //    | D      | 1   C
    //    | D      | 1   C
    // 30 | D      | 1   C
    //
    // For example: fragment "A" can be found from index 0 to 10 in the
    // left file, and from index 20 to 30 in the right file, this fragment
    // contains another fragment "B" which can be found on index 5 resp.
    // 25 of the left resp. right file.
    //
    #[test]
    fn test_merging_and_squasing() {
        let f1 = dummy_file("file1");
        let f2 = dummy_file("file2");
        let mut pair = Pair::new(&f1, &f2);

        // bigger match (A)
        for i in 0..10 {
            pair.add(
                &vec![Occurrence {
                    file: f1.clone(),
                    fingerprint: dummy_fingerprint("A", i),
                }],
                &vec![Occurrence {
                    file: f2.clone(),
                    fingerprint: dummy_fingerprint("A", i + 20),
                }],
            );
            assert_eq!(pair.fragments().len(), 1);
        }

        // contained match (B)
        pair.add(
            &vec![Occurrence {
                file: f1.clone(),
                fingerprint: dummy_fingerprint("B", 5),
            }],
            &vec![Occurrence {
                file: f2.clone(),
                fingerprint: dummy_fingerprint("B", 25),
            }],
        );

        assert_eq!(pair.fragments().len(), 2);

        // bigger match, same location (C)
        for i in 0..10 {
            pair.add(
                &vec![Occurrence {
                    file: f1.clone(),
                    fingerprint: dummy_fingerprint("C", i + 10),
                }],
                &vec![Occurrence {
                    file: f2.clone(),
                    fingerprint: dummy_fingerprint("C", i + 10),
                }],
            );
            assert_eq!(pair.fragments().len(), 3);
        }

        // bigger match (D)
        for i in 0..10 {
            pair.add(
                &vec![Occurrence {
                    file: f1.clone(),
                    fingerprint: dummy_fingerprint("D", i + 20),
                }],
                &vec![Occurrence {
                    file: f2.clone(),
                    fingerprint: dummy_fingerprint("D", i),
                }],
            );
            assert_eq!(pair.fragments().len(), 4);
        }

        // contained match (E)
        pair.add(
            &vec![Occurrence {
                file: f1.clone(),
                fingerprint: dummy_fingerprint("E", 25),
            }],
            &vec![Occurrence {
                file: f2.clone(),
                fingerprint: dummy_fingerprint("E", 5),
            }],
        );

        assert_eq!(pair.fragments().len(), 5);

        // match not contained (F)
        pair.add(
            &vec![Occurrence {
                file: f1.clone(),
                fingerprint: dummy_fingerprint("F", 5),
            }],
            &vec![Occurrence {
                file: f2.clone(),
                fingerprint: dummy_fingerprint("F", 5),
            }],
        );

        let fragments = pair.fragments();
        dbg!(fragments
            .iter()
            .map(|f| fragment_name(f))
            .collect::<Vec<&str>>());

        assert_eq!(fragment_name(fragments[0]), "A");
        assert_eq!(fragment_name(fragments[1]), "B");
        assert_eq!(fragment_name(fragments[2]), "F");
        assert_eq!(fragment_name(fragments[3]), "C");
        assert_eq!(fragment_name(fragments[4]), "D");
        assert_eq!(fragment_name(fragments[5]), "E");
        assert_eq!(fragments.len(), 6);

        pair.squash();

        let fragments = pair.fragments();
        dbg!(fragments
            .iter()
            .map(|f| fragment_name(f))
            .collect::<Vec<&str>>());

        assert_eq!(fragment_name(fragments[0]), "A");
        assert_eq!(fragment_name(fragments[1]), "F");
        assert_eq!(fragment_name(fragments[2]), "C");
        assert_eq!(fragment_name(fragments[3]), "D");

        assert_eq!(fragments.len(), 4);
    }
}
