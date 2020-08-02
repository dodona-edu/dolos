import { SharedKmer } from "./sharedKmer";
import { Selection } from "../util/selection";

/**
 * The information that is needed for one side of a match.
 */
export interface Side {
  /**
   * Start index in the AST of this kmer.
   */
  start: number;
  /**
   * Stop index (inclusive) in the AST of this kmer.
   */
  stop: number;
  /**
   * The index of when this kmer was outputted by the HashFilter.
   * This differs of kmerStart if not all kmers in a file are outputted.
   */
  index: number;
  /**
   * The selection in the actual file corrresponding to this kmer.
   */
  location: Selection;
  /**
   * The AST data corresponding to this kmer.
   */
  data: string;
}

/**
 * A match represents a common kmer between two files.
 *
 * It keeps track of the kmer index in both files, the hashing of the kmer, and
 * the location with its data it represents.
 */
export class Match {
  constructor(
    public readonly left: Side,
    public readonly right: Side,
    public readonly kmer: SharedKmer,
  ) {
  }
}
