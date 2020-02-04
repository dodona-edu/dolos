export class Match<Location> {
  constructor(
    public readonly leftLocation: Location,
    public readonly leftWindow: string,
    public readonly rightLocation: Location,
    public readonly rightWindow: string,
    public readonly hash: number,
  ) {

  }
}
