import { Options } from "../util/options";
import { ScoredPair } from "./winnowing/winnowingReportBuilder";
import { AstFileNullable } from "../file/astFile";

export interface Report {
   files: AstFileNullable[],
   scoredPairs: ScoredPair[],
   metadata: Options,
   sharedFingerprints: SharedFingerprint[]
}


export interface SharedFingerprint {
   id: number
   fingerprint: number
   data: string | null
   fileIds: number[]
}
