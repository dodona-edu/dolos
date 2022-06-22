import { File, Fragment } from "@/api/models";
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
  fragments: Fragment[] | null;
  pairedMatches: PairedSemanticGroups<DecodedSemanticResult>[];
  unpairedMatches: UnpairedSemanticGroups<DecodedSemanticResult>[];
  leftCovered: number;
  rightCovered: number;
}
