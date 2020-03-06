
/**
 * This class represents all the matches between two files (i.e. the
 * intersection of their hashes).
 */
export class Intersection<Similarity> {

  public readonly matches: Similarity[];

  constructor(
    public readonly leftFile: string,
    public readonly rightFile: string
  ) {
    this.matches = [];
  }
}
