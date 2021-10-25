import { SharedWinnowingFingerprint } from "./winnowing/sharedWinnowingFingerprint";
import { Region } from "../util/region";

/**
 * The information that is needed for one side of a paired occurrence.
 */
export interface TokenStreamRegion {
  /**
   * Start index in the token stream of this fingerprint.
   */
  start: number;
  /**
   * Stop index (inclusive) in the token stream of this fingerprint.
   */
  stop: number;
  /**
   * The index of when this fingerprint was outputted by the HashFilter.
   * This differs of kgramStart if not all fingerprint in a file are outputted.
   */
  index: number;
  /**
   * The selection in the actual file corrresponding to this fingerprint.
   */
  location: Region;
  /**
   * The AST data corresponding to this fingerprint.
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
    public readonly left: TokenStreamRegion,
    public readonly right: TokenStreamRegion,
    public readonly fingerprint: SharedWinnowingFingerprint
  ) {
  }
}
