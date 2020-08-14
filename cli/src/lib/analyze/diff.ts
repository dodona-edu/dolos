import { Range } from "../util/range";
import { PairedOccurrence } from "./pairedOccurrence";
import { Block } from "./block";
import { TokenizedFile } from "../file/tokenizedFile";
import Identifiable from "../util/identifiable";

type LeftRight = string;

/**
 * This class represents all the blocks between two files (i.e. the
 * intersection of their hashes).
 */
export class Diff extends Identifiable {

  private blockStart: Map<LeftRight, Block> = new Map();
  private blockEnd: Map<LeftRight, Block> = new Map();

  constructor(
    public readonly leftFile: TokenizedFile,
    public readonly rightFile: TokenizedFile
  ) { super(); }

  get blockCount(): number {
    return this.blockStart.size;
  }

  /**
   * Creates an array of blocks in this intersection, sorted by their
   * leftKmers range.
   */
  public blocks(): Array<Block> {
    return Array.of(...this.blockStart.values())
      .sort((a , b) => Range.compare(a.leftKmers, b.leftKmers));
  }

  /**
   * Add a new paired occurrence to the intersection.
   *
   * Tries to extend existing blocks, or creates a new block.
   */
  public addPairedOccurrence(newPairedOccurrence: PairedOccurrence): void {
    const start = this.key(newPairedOccurrence.left.index, newPairedOccurrence.right.index);
    const end = this.key(newPairedOccurrence.left.index + 1, newPairedOccurrence.right.index + 1);

    let block = this.blockEnd.get(start);
    if (block) {

      // extend block at starting position
      this.blockEnd.delete(start);
      block.extendWithPairedOccurrence(newPairedOccurrence);

    } else {

      // no block on our starting position, create a new one
      block = new Block(newPairedOccurrence);
      this.blockStart.set(start, block);
      this.blockEnd.set(end, block);
    }

    const nextBlock = this.blockStart.get(end);

    if (nextBlock) {
      // there is a block directly after us we can extend

      // remove next block's start position
      this.blockStart.delete(end);

      // extend ourselves
      block.extendWithBlock(nextBlock);

      // overwrite the end position of the next block with ours
      this.blockEnd.set(
        this.key(nextBlock.leftKmers.to, nextBlock.rightKmers.to),
        block
      );
    } else {

      // no block after us, just set our end position
      this.blockEnd.set(end, block);
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
   * Returns the length (in kmers) of the largest block in this diff.
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
      .forEach(f => this.removeBlock(f));
  }

  /**
   * Remove each Block that is contained in a bigger Block.
   */
  public squash(): void {
    const kandidates: Set<Block> = new Set();
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
          this.removeBlock(match);
          removed = true;
        }
        next = iter.next();
      }

      if (!removed) {
        kandidates.add(match);
      }
    }
  }

  private removeBlock(block: Block): void {
    this.blockStart.delete(
      this.key(block.leftKmers.from, block.rightKmers.from)
    );
    this.blockEnd.delete(
      this.key(block.leftKmers.to, block.rightKmers.to)
    );
  }

  private key(left: number, right: number): LeftRight {
    return `${left}|${right}`;
  }
}
