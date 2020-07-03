import { Range } from "../util/range";
import { Match } from "./match";
import { Fragment } from "./fragment";
import { TokenizedFile } from "../file/tokenizedFile";
import Identifiable from "../util/identifiable";

type LeftRight = string;

/**
 * This class represents all the fragments between two files (i.e. the
 * intersection of their hashes).
 */
export class Intersection extends Identifiable {

  private fragmentStart: Map<LeftRight, Fragment> = new Map();
  private fragmentEnd: Map<LeftRight, Fragment> = new Map();

  constructor(
    public readonly leftFile: TokenizedFile,
    public readonly rightFile: TokenizedFile
  ) { super() }

  get fragmentCount(): number {
    return this.fragmentStart.size;
  }

  /**
   * Creates an array of fragments in this intersection, sorted by their
   * leftKmers range.
   */
  public fragments(): Array<Fragment> {
    return Array.of(...this.fragmentStart.values())
      .sort((a , b) => Range.compare(a.leftKmers, b.leftKmers));
  }

  /**
   * Add a new match to the intersection.
   *
   * Tries to extend existing fragments, or creates a new fragment.
   */
  public addMatch(newMatch: Match): void {
    const start = this.key(newMatch.left.index, newMatch.right.index);
    const end = this.key(newMatch.left.index + 1, newMatch.right.index + 1);

    let fragment = this.fragmentEnd.get(start);
    if (fragment) {

      // extend fragment at starting position
      this.fragmentEnd.delete(start);
      fragment.extendWithMatch(newMatch);

    } else {

      // no fragment on our starting position, create a new one
      fragment = new Fragment(newMatch);
      this.fragmentStart.set(start, fragment);
      this.fragmentEnd.set(end, fragment);
    }

    const nextFragment = this.fragmentStart.get(end);

    if (nextFragment) {
      // there is a fragment directly after us we can extend

      // remove next fragment's start position
      this.fragmentStart.delete(end);

      // extend ourselves
      fragment.extendWithFragment(nextFragment);

      // overwrite the end position of the next fragment with ours
      this.fragmentEnd.set(
        this.key(nextFragment.leftKmers.to, nextFragment.rightKmers.to),
        fragment
      );
    } else {

      // no fragment after us, just set our end position
      this.fragmentEnd.set(end, fragment);
    }
  }

  /**
   * Calculate how much kmers both files share. Each kmer is only counted once.
   */
  public totalOverlapKmers(): number {
    return Range.totalCovered(
      this.fragments().map(m => m.leftKmers).sort(Range.compare)
    );
  }

  /**
   * Returns the length (in kmers) of the largest fragment in this intersecion.
   */
  public largestFragmentLength(): number {
    return Math.max(...this.fragments().map(f => f.matches.length));
  }

  /**
   * Remove fragments which have fewer than the given minimum of matches.
   */
  public removeSmallerThan(minimum: number): void {
    this.fragments()
      .filter(f => f.matches.length < minimum)
      .forEach(f => this.removeFragment(f));
  }

  /**
   * Remove each Fragment that is contained in a bigger Fragment.
   */
  public squash(): void {
    const kandidates: Set<Fragment> = new Set();
    for (const match of this.fragments()) {

      const iter = kandidates.values();
      let next = iter.next();
      let removed = false;
      while (!next.done && !removed) {
        const kandidate = next.value;
        if (match.leftKmers.from > kandidate.leftKmers.to) {
          kandidates.delete(kandidate);
        } else if (
          kandidate.leftKmers.contains(match.leftKmers) &&
          kandidate.rightKmers.contains(match.rightKmers)
        ){
          this.removeFragment(match);
          removed = true;
        }
        next = iter.next();
      }

      if (!removed) {
        kandidates.add(match);
      }
    }
  }

  private removeFragment(fragment: Fragment): void {
    this.fragmentStart.delete(
      this.key(fragment.leftKmers.from, fragment.rightKmers.from)
    );
    this.fragmentEnd.delete(
      this.key(fragment.leftKmers.to, fragment.rightKmers.to)
    );
  }

  private key(left: number, right: number): LeftRight {
    return `${left}|${right}`;
  }
}
