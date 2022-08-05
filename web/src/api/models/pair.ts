import { File, Fragment, Match } from "@/api/models";
import {
  DecodedSemanticResult,
  PairedSemanticGroups,
  UnpairedSemanticGroups,
} from "@dodona/dolos-lib";

export interface Pair {
  id: number;
  leftFile: File;
  rightFile: File;
  similarity: number;
  longestFragment: number;
  totalOverlap: number;
  leftCovered: number;
  rightCovered: number;
  matches: Match[];
  fragments: Fragment[] | null;
  pairedMatches: PairedSemanticGroups<DecodedSemanticResult>[];
  unpairedMatches: UnpairedSemanticGroups<DecodedSemanticResult>[];
}
