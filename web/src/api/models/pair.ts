import { File, Fragment } from "@/api/models";
import { Region } from "@dodona/dolos-core";

export interface Pair {
  id: number;
  leftFile: File;
  rightFile: File;
  similarity: number;
  longestFragment: number;
  totalOverlap: number;
  leftCovered: number;
  rightCovered: number;
  fragments: Fragment[] | null;
  leftIgnoredKgrams: Region[];
  rightIgnoredKgrams: Region[];
}
