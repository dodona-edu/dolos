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
                if !(fragment.start.0 <= candidate.start.0
                    && candidate.end.0 <= fragment.end.0
                    && fragment.start.1 <= candidate.start.1
                    && candidate.end.1 <= fragment.end.1)
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
}
