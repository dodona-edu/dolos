import { ScoredPairs } from "./winnowingReport";
import { TokenizedFile } from "../file/tokenizedFile";
import { Options } from "../util/options";

export interface Report {
    get scoredPairs(): Array<ScoredPairs>;
    get files(): TokenizedFile[];
    readonly options: Options;
}
