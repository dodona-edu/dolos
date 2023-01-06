import { Range } from "../util/range";
import { PairedOccurrence } from "./pairedOccurrence";
import { Fragment } from "./fragment";
import { TokenizedFile } from "../file/tokenizedFile";
import Identifiable from "../util/identifiable";

type LeftRight = string;

/**
 * This class represents all the fragments between two files (i.e. the
 * pair of their hashes).
 */
export class Pair extends Identifiable {

  private fragmentStart: Map<LeftRight, Fragment> = new Map();
  private fragmentEnd: Map<LeftRight, Fragment> = new Map();
  public longestFragment: number = 0;

  constructor(
    public readonly leftFile: TokenizedFile,
    public readonly rightFile: TokenizedFile
  ) { super(); }

  get fragmentCount(): number {
    return this.fragmentStart.size;
  }

  /**
   * Creates an array of fragments in this pair, sorted by their
   * leftkgrams range.
   */
  public fragments(): Array<Fragment> {
    return Array.from(this.fragmentStart.values())
      .sort((a , b) => Range.compare(a.leftkgrams, b.leftkgrams));
  }

  /**
   * Add a new paired occurrence to the pair.
   *
   * Tries to extend existing fragments, or creates a new fragment.
   */
  public addPair(newPair: PairedOccurrence): void {
    const start = this.key(newPair.left.index, newPair.right.index);
    const end = this.key(newPair.left.index + 1, newPair.right.index + 1);

    let fragment = this.fragmentEnd.get(start);
    if (fragment) {

      // extend fragment at starting position
      this.fragmentEnd.delete(start);
      fragment.extendWith(newPair);

    } else {

      // no fragment on our starting position, create a new one
      fragment = new Fragment(newPair);
      this.fragmentStart.set(start, fragment);
      this.fragmentEnd.set(end, fragment);
    }

    const nextfragment = this.fragmentStart.get(end);

    if (nextfragment) {
      // there is a fragment directly after us we can extend

      // remove next fragment's start position
      this.fragmentStart.delete(end);

      // extend ourselves
      fragment.extendWithFragment(nextfragment);

      // overwrite the end position of the next fragment with ours
      this.fragmentEnd.set(
        this.key(nextfragment.leftkgrams.to, nextfragment.rightkgrams.to),
        fragment
      );
    } else {

      // no fragment after us, just set our end position
      this.fragmentEnd.set(end, fragment);
    }
    this.longestFragment = Math.max(fragment.pairs.length, this.longestFragment);
  }

  /**
   * Calculate how much kgrams both files share. Each kgram is only counted once.
   */
  public totalOverlapkgrams(): number {
    return Range.totalCovered(
      this.fragments().map(m => m.leftkgrams).sort(Range.compare)
    );
  }

  /**
   * Remove fragments which have fewer than the given minimum of pairedOccurrences.
   */
  public removeSmallerThan(minimum: number): void {
    this.fragments()
      .filter(f => f.pairs.length < minimum)
      .forEach(f => this.removefragment(f));
  }

  /**
   * Remove each Fragment that is contained in a bigger Fragment.
   */
  public squash(): void {
    // This algorithm only looks to the `leftkgrams` range of an fragment.
    // If a fragment is contained within another on the left side, we check if
    // this is also the case on the right side, before removing the fragment.

    // By sorting, and then doing a linear comparison, we can perform this
    // method in O(n log n) time, whereas checking all pairs of fragments would
    // be O(n²).

    // A list with the fragments sorted by the start of their range interval
    const sortedByStart = this.fragments();

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
          this.removefragment(candidate);
        }
        j += 1;
      }
      j += 1;
    }
  }

  private removefragment(fragment: Fragment): void {
    this.fragmentStart.delete(
      this.key(fragment.leftkgrams.from, fragment.rightkgrams.from)
    );
    this.fragmentEnd.delete(
      this.key(fragment.leftkgrams.to, fragment.rightkgrams.to)
    );
  }

  private key(left: number, right: number): LeftRight {
    return `${left}|${right}`;
  }
}
