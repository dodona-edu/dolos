import { ScoredPairs } from "./winnowingReport";
import { Options } from "../util/options";
import { SharedFingerprint } from "../outputFormat/exchangeData";
import { AstFileNullable } from "../outputFormat/astFile";

export interface Report {
    get scoredPairs(): Array<ScoredPairs>;
    get files(): Array<AstFileNullable>;
    readonly options: Options;
    sharedFingerprints(): Array<SharedFingerprint>
}
