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
