import { SharedKmer } from "./sharedKmer";
import { Region } from "../util/region";

/**
 * The information that is needed for one side of a paired occurrence.
 */
export interface ASTRegion {
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
  location: Region;
  /**
   * The AST data corresponding to this kmer.
   */
  data: string;
}

/**
 * A paired occurrence represents a common kmer between two files.
 *
 * It keeps track of the kmer index in both files, the hashing of the kmer, and
 * the location with its data it represents.
 */
export class PairedOccurrence {
  constructor(
    public readonly left: ASTRegion,
    public readonly right: ASTRegion,
    public readonly kmer: SharedKmer,
  ) {
  }
}
