import { Pair } from "./pair";
import { Options } from "../util/options";
import { TokenizedFile } from "../file/tokenizedFile";

export interface ReportInterface {
   get scoredPairs(): Array<ScoredPairs>;
   get files(): TokenizedFile[];
   readonly options: Options;
}

export interface ScoredPairs {
    pair: Pair;
    overlap: number;
    longest: number;
    similarity: number;
}
