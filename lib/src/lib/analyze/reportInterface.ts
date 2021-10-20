import { Pair } from "./pair";

export interface ReportInterface {
   get scoredPairs(): Array<ScoredPairs>;
}

export interface ScoredPairs {
    pair: Pair;
    overlap: number;
    longest: number;
    similarity: number;
}
