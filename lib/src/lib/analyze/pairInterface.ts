import Identifiable from "./../util/identifiable";
import { TokenizedFile } from "../file/tokenizedFile";
import { FragmentInterface } from "./fragmentInterface";

export abstract class PairInterface extends Identifiable {
  /**
   * Creates an array of fragments in this pair, sorted by their
   * leftkgrams range.
   */
  abstract fragments(): Array<FragmentInterface>;
  abstract readonly leftFile: TokenizedFile;
  abstract readonly rightFile: TokenizedFile;
}

