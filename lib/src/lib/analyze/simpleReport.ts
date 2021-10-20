import { ReportInterface, ScoredPairs } from "./reportInterface";

export class SimpleReport implements ReportInterface {

  constructor(private readonly privateScoredPairs: Array<ScoredPairs>) {
  }

  get scoredPairs(): Array<ScoredPairs> {
    return this.privateScoredPairs;
  }
}
