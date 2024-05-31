import { Range } from "../util/range.js";
import { PairedOccurrence } from "./pairedOccurrence.js";
import { Fragment } from "./fragment.js";
import { Identifiable } from "../util/identifiable.js";
import { SharedFingerprint } from "./sharedFingerprint.js";
import { FileEntry, Occurrence } from "./fingerprintIndex.js";
import { TokenizedFile } from "../file/tokenizedFile.js";

type LeftRight = string;

interface Kgram {
  hash: number,
  index: number,
}

/**
 * This class represents all the fragments between two files (i.e. the
 * pair of their hashes).
 */
export class Pair extends Identifiable {

  private readonly shared: Array<SharedFingerprint>;

  public readonly leftFile: TokenizedFile;
  public readonly rightFile: TokenizedFile;

  public readonly leftCovered;
  public readonly rightCovered;
  public readonly leftTotal;
  public readonly rightTotal;
  public readonly longest;
  public readonly similarity;
  public readonly leftIgnored;
  public readonly rightIgnored;

  constructor(
    public readonly leftEntry: FileEntry,
    public readonly rightEntry: FileEntry,
  ) {
    super();
    this.leftFile = leftEntry.file;
    this.rightFile = rightEntry.file;
    let small, large;
    this.shared = [];
    if (leftEntry.shared.size < rightEntry.shared.size) {
      small = leftEntry;
      large = rightEntry;
    } else {
      small = rightEntry;
      large = leftEntry;
    }

    for (const fingeprint of small.shared) {
      if (large.shared.has(fingeprint)) {
        this.shared.push(fingeprint);
      }
    }

    const left: Kgram[] = [];
    const right: Kgram[] = [];
    for (const fingerprint of this.shared) {
      for (const occurrence of fingerprint.occurrencesOf(this.leftFile)) {
        left.push({ hash: fingerprint.hash, index: occurrence.side.index });
      }
      for (const occurrence of fingerprint.occurrencesOf(this.rightFile)) {
        right.push({ hash: fingerprint.hash, index: occurrence.side.index });
      }
    }
    left.sort((a, b) => a.index - b.index);
    right.sort((a, b) => a.index - b.index);

    this.longest = this.longestCommonSubstring(left, right);

    this.leftCovered = left.length;
    this.rightCovered = right.length;
    this.leftIgnored = leftEntry.ignored.size;
    this.rightIgnored = leftEntry.ignored.size;
    this.leftTotal = leftEntry.kgrams.length;
    this.rightTotal = rightEntry.kgrams.length;
    const denominator = this.leftTotal + this.rightTotal - this.leftIgnored - this.rightIgnored;
    if (denominator > 0) {
      this.similarity = (this.leftCovered + this.rightCovered) / denominator;
    } else {
      this.similarity = 0;
    }
  }

  private longestCommonSubstring(l: Kgram[], r: Kgram[]): number {
    let short, long;
    if (l.length < r.length) {
      short = l;
      long = r;
    } else {
      short = r;
      long = l;
    }

    let longest = 0;
    let prev: Array<number> = [];
    let curr: Array<number> = [];
    for (const l of long) {
      for (const s of short) {
        if (l.hash == s.hash) {
          curr[s.index] = (prev[s.index - 1] || 0) + 1;
          longest = curr[s.index] > longest ? curr[s.index] : longest;
        }
      }
      const tmp = prev;
      tmp.length = 0;
      prev = curr;
      curr = tmp;
    }

    return longest;
  }

  public totalCoverLeft(): number {
    return this.leftCovered;
  }

  public totalCoverRight(): number {
    return this.rightCovered;
  }

  get overlap(): number {
    return this.leftCovered + this.rightCovered;
  }

  public buildFragments(minimumOccurrences = 1): Array<Fragment> {
    const fragmentStart: Map<LeftRight, Fragment> = new Map();
    const fragmentEnd: Map<LeftRight, Fragment> = new Map();

    for (const fingerprint of this.shared) {
      const left = Array.from(fingerprint.occurrencesOf(this.leftFile).values());
      const right = Array.from(fingerprint.occurrencesOf(this.rightFile).values());
      for (let i = 0; i < left.length; i++) {
        const leftOcc: Occurrence = left[i];
        for (let j = 0; j < right.length; j++) {
          const rightOcc: Occurrence = right[j];
          const occ = new PairedOccurrence(leftOcc.side, rightOcc.side, fingerprint);
          this.addPair(fragmentStart, fragmentEnd, occ);
        }
      }
    }
    this.squash(fragmentStart, fragmentEnd);

    for (const fragment of fragmentStart.values()) {
      if (fragment.pairs.length < minimumOccurrences) {
        this.removefragment(fragmentStart, fragmentEnd, fragment);
      }
    }

    return Array.from(fragmentStart.values())
      .sort((a , b) => Range.compare(a.leftkgrams, b.leftkgrams));
  }

  /**
   * Add a new paired occurrence to the pair.
   *
   * Tries to extend existing fragments, or creates a new fragment.
   */
  private addPair(
    fragmentStart: Map<LeftRight, Fragment>,
    fragmentEnd: Map<LeftRight, Fragment>,
    newPair: PairedOccurrence
  ): Fragment {
    const start = this.key(newPair.left.index, newPair.right.index);
    const end = this.key(newPair.left.index + 1, newPair.right.index + 1);

    let fragment = fragmentEnd.get(start);
    if (fragment) {

      // extend fragment at starting position
      fragmentEnd.delete(start);
      fragment.extendWith(newPair);

    } else {

      // no fragment on our starting position, create a new one
      fragment = new Fragment(newPair);
      fragmentStart.set(start, fragment);
      fragmentEnd.set(end, fragment);
    }

    const nextfragment = fragmentStart.get(end);

    if (nextfragment) {
      // there is a fragment directly after us we can extend

      // remove next fragment's start position
      fragmentStart.delete(end);

      // extend ourselves
      fragment.extendWithFragment(nextfragment);

      // overwrite the end position of the next fragment with ours
      fragmentEnd.set(
        this.key(nextfragment.leftkgrams.to, nextfragment.rightkgrams.to),
        fragment
      );
    } else {

      // no fragment after us, just set our end position
      fragmentEnd.set(end, fragment);
    }
    return fragment;
  }

  /**
   * Remove each Fragment that is contained in a bigger Fragment.
   */
  private squash(fragmentStart: Map<LeftRight, Fragment>, fragmentEnd: Map<LeftRight, Fragment>): void {
    // This algorithm only looks to the `leftkgrams` range of an fragment.
    // If a fragment is contained within another on the left side, we check if
    // this is also the case on the right side, before removing the fragment.

    // By sorting, and then doing a linear comparison, we can perform this
    // method in O(n log n) time, whereas checking all pairs of fragments would
    // be O(n²).

    // A list with the fragments sorted by the start of their range interval
    const sortedByStart = Array.from(fragmentStart.values())
      .sort((a , b) => Range.compare(a.leftkgrams, b.leftkgrams));

    // A list with the fragments sorted by the end of their range interval
    const sortedByEnd = Array.from(sortedByStart);
    sortedByEnd.sort((a: Fragment, b: Fragment) => Range.compareEnds(a.leftkgrams, b.leftkgrams));

    let j = 0;
    const seen = new Set<Fragment>();

    // Iterate over the fragments as would encounter them by the start of their range
    for(const started of sortedByStart) {

      // If we have already seen this fragment, that means it is contained
      // within a larger fragment. We have already handled this fragment, so
      // we can skip it.
      if (seen.has(started)) {
        continue;
      }

      // We walk trough the fragments sorted by the end of its range. If we
      // encounter fragments other than the current fragment, that means it
      // starts and stops before our current fragments stops, so we possibly
      // fully enclose that fragment.
      while (started !== sortedByEnd[j]) {
        const candidate = sortedByEnd[j];
        seen.add(candidate);
        // We possibly contain the left side, so check if the full fragment is
        // contained.
        if (started.leftkgrams.contains(candidate.leftkgrams) &&
          started.rightkgrams.contains(candidate.rightkgrams)) {
          // If this is the case, remove the contained fragment.
          this.removefragment(fragmentStart, fragmentEnd, candidate);
        }
        j += 1;
      }
      j += 1;
    }
  }

  private removefragment(
    fragmentStart: Map<LeftRight, Fragment>,
    fragmentEnd: Map<LeftRight, Fragment>,
    fragment: Fragment
  ): void {
    fragmentStart.delete(
      this.key(fragment.leftkgrams.from, fragment.rightkgrams.from)
    );
    fragmentEnd.delete(
      this.key(fragment.leftkgrams.to, fragment.rightkgrams.to)
    );
  }

  private key(left: number, right: number): LeftRight {
    return `${left}|${right}`;
  }
}
