import { PairInterface } from "./pairInterface";
import { TokenizedFile } from "../file/tokenizedFile";
import { FragmentInterface } from "./fragmentInterface";

export class SimplePair extends PairInterface {
  fragments(): Array<FragmentInterface> {
    return this.fragmentList;
  }

  public constructor(
      readonly leftFile: TokenizedFile,
      readonly rightFile: TokenizedFile,
      public readonly fragmentList: Array<FragmentInterface>
  ) {
    super();
  }

}
