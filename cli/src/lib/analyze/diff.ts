import { Range } from "../util/range";
import { PairedOccurrence } from "./pairedOccurrence";
import { Hunk } from "./hunk";
import { TokenizedFile } from "../file/tokenizedFile";
import Identifiable from "../util/identifiable";

type LeftRight = string;

/**
 * This class represents all the blocks between two files (i.e. the
 * intersection of their hashes).
 */
export class Diff extends Identifiable {

  private fragmentStart: Map<LeftRight, Hunk> = new Map();
  private fragmentEnd: Map<LeftRight, Hunk> = new Map();

  constructor(
    public readonly leftFile: TokenizedFile,
    public readonly rightFile: TokenizedFile
  ) { super() }

  get blockCount(): number {
    return this.fragmentStart.size;
  }

  /**
   * Creates an array of blocks in this intersection, sorted by their
   * leftKmers range.
   */
  public blocks(): Array<Hunk> {
    return Array.of(...this.fragmentStart.values())
      .sort((a , b) => Range.compare(a.leftKmers, b.leftKmers));
  }

  /**
   * Add a new paired occurrence to the intersection.
   *
   * Tries to extend existing blocks, or creates a new fragment.
   */
  public addPairedOccurrence(newPairedOccurrence: PairedOccurrence): void {
    const start = this.key(newPairedOccurrence.left.index, newPairedOccurrence.right.index);
    const end = this.key(newPairedOccurrence.left.index + 1, newPairedOccurrence.right.index + 1);

    let fragment = this.fragmentEnd.get(start);
    if (fragment) {

      // extend fragment at starting position
      this.fragmentEnd.delete(start);
      fragment.extendWithPairedOccurrence(newPairedOccurrence);

    } else {

      // no fragment on our starting position, create a new one
      fragment = new Hunk(newPairedOccurrence);
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
      this.blocks().map(m => m.leftKmers).sort(Range.compare)
    );
  }

  /**
   * Returns the length (in kmers) of the largest fragment in this intersecion.
   */
  public largestBlockLength(): number {
    return Math.max(...this.blocks().map(f => f.pairedOccurrences.length));
  }

  /**
   * Remove blocks which have fewer than the given minimum of pairedOccurrences.
   */
  public removeSmallerThan(minimum: number): void {
    this.blocks()
      .filter(f => f.pairedOccurrences.length < minimum)
      .forEach(f => this.removeFragment(f));
  }

  /**
   * Remove each Fragment that is contained in a bigger Fragment.
   */
  public squash(): void {
    const kandidates: Set<Hunk> = new Set();
    for (const match of this.blocks()) {

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

  private removeFragment(fragment: Hunk): void {
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
