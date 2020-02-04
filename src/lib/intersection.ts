import { Match } from "./match";

/**
 * This class represents all the matches between two files (i.e. the
 * intersection of their hashes).
 */
export class Intersection<Location> {

  public readonly matches: Array<Match<Location>>;

  constructor(
    public readonly leftFile: string,
    public readonly rightFile: string,
  ) {
    this.matches = [];
  }

}
