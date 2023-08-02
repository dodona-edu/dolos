import { SharedFingerprint } from "./sharedFingerprint.js";
import { Region } from "../util/region.js";

/**
 * The information that is needed for one side of a paired occurrence.
 */
export interface ASTRegion {
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
  /**
   * The selection in the actual file corresponding to this kgram.
   */
  location: Region;
  /**
   * The AST data corresponding to this kgram.
   */
  data: Array<string> | null;
}

/**
 * A paired occurrence represents a common fingerprint between two files.
 *
 * It keeps track of the kgram index in both files, the hashing of the kgram, and
 * the location with its data it represents.
 */
export class PairedOccurrence {
  constructor(
    public readonly left: ASTRegion,
    public readonly right: ASTRegion,
    public readonly fingerprint: SharedFingerprint
  ) {
  }
}
