/**
 * A match represents a common kmer between two files.
 *
 * It keeps track of the kmer index in both files, the hash of the kmer, and
 * the location with its data it represents.
 */
export class Match<Location> {
  constructor(
    public readonly leftKmer: number,
    public readonly leftLocation: Location,
    public readonly leftData: string,
    public readonly rightKmer: number,
    public readonly rightLocation: Location,
    public readonly rightData: string,
    public readonly hash: number
  ) {
  }
}
