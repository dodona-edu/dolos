import { Range } from "../util/range";
import { PairedOccurrence } from "./pairedOccurrence";
import { Fragment } from "./fragment";
import { TokenizedFile } from "../file/tokenizedFile";
import { PairInterface } from "./pairInterface";

type LeftRight = string;

/**
 * This class represents all the fragments between two files (i.e. the
 * pair of their hashes).
 */
export class Pair extends PairInterface {

  private fragmentStart: Map<LeftRight, Fragment> = new Map();
  private fragmentEnd: Map<LeftRight, Fragment> = new Map();

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
    return Array.of(...this.fragmentStart.values())
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
   * Returns the length (in kgrams) of the largest fragment in this pair.
   */
  public longestFragment(): number {
    return Math.max(...this.fragments().map(f => f.pairs.length));
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
    const kandidates: Set<Fragment> = new Set();
    for (const match of this.fragments()) {

      const iter = kandidates.values();
      let next = iter.next();
      let removed = false;
      while (!next.done && !removed) {
        const kandidate = next.value;
        if (match.leftkgrams.from > kandidate.leftkgrams.to) {
          kandidates.delete(kandidate);
        } else if (
          kandidate.leftkgrams.contains(match.leftkgrams) &&
          kandidate.rightkgrams.contains(match.rightkgrams)
        ){
          this.removefragment(match);
          removed = true;
        }
        next = iter.next();
      }

      if (!removed) {
        kandidates.add(match);
      }
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
