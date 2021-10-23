import { ScoredPairs } from "./winnowingReport";
import { Options } from "../util/options";
import { AstFileNullable, SharedFingerprint } from "../outputFormat/outputFormat";

export interface Report {
    get scoredPairs(): Array<ScoredPairs>;
    get files(): AstFileNullable[];
    readonly options: Options;
    sharedFingerprints(): Array<SharedFingerprint>
}
