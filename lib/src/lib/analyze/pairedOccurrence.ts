import { SharedFingerprint } from "./sharedFingerprint";
import { Region } from "../util/region";

export interface ASTRegionInterface {
  /**
   * Start index in the AST of this kgram.
   */
  start: number;
  /**
   * Stop index (inclusive) in the AST of this kgram.
   */
  stop: number;
  /**
   * The index of when this kgram was outputted by the HashFilter.
   * This differs of kgramStart if not all kgrams in a file are outputted.
   */
  index: number;
}

/**
 * The information that is needed for one side of a paired occurrence.
 */
export interface ASTRegion extends ASTRegionInterface {
  /**
   * The selection in the actual file corrresponding to this kgram.
   */
  location: Region;
  /**
   * The AST data corresponding to this kgram.
   */
  data: Array<string> | null;
}

export interface PairedOccurrenceInterface {
  readonly fingerprint: SharedFingerprint;
  readonly left: ASTRegionInterface;
  readonly right: ASTRegionInterface;
}

/**
 * A paired occurrence represents a common fingerprint between two files.
 *
 * It keeps track of the kgram index in both files, the hashing of the kgram, and
 * the location with its data it represents.
 */
export class PairedOccurrence implements PairedOccurrenceInterface {
  constructor(
      public readonly left: ASTRegion,
      public readonly right: ASTRegion,
      readonly fingerprint: SharedFingerprint
  ) {
  }
}
