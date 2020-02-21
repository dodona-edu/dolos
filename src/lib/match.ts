export class Match<Location> {
  constructor(
    public readonly leftLocation: Location,
    public readonly leftData: string,
    public readonly rightLocation: Location,
    public readonly rightData: string,
    public readonly hash: number,
  ) {

  }
}
