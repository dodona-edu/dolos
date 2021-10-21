import { ReportInterface, ScoredPairs } from "./reportInterface";
import { Options } from "../util/options";
import { TokenizedFile } from "../file/tokenizedFile";

export class SimpleReport implements ReportInterface {

  constructor(
      private readonly privateScoredPairs: Array<ScoredPairs>,
      public readonly options: Options,
      public readonly files: TokenizedFile[]
  ) {
  }

  get scoredPairs(): Array<ScoredPairs> {
    return this.privateScoredPairs;
  }

}
