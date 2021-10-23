import { Options } from "../util/options";
import { ScoredPairs } from "../analyze/winnowingReport";
import { AstFileNullable } from "./astFile";

export interface ExchangeData {
   files: AstFileNullable[],
   pairs: ScoredPairs[],
   metadata: Options,
   fingerprints: SharedFingerprint[]
}


export interface SharedFingerprint {
   id: number
   fingerprint: number
   data: string | null
   fileIds: number[]
}
