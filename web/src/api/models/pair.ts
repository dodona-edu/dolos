import { File, Fragment, Selection } from "@/api/models";

export interface Pair {
  id: number;
  leftFile: File;
  rightFile: File;
  similarity: number;
  longestFragment: number;
  totalOverlap: number;
  leftCovered: number;
  rightCovered: number;
  leftTotal: number;
  rightTotal: number;
  fragments: Fragment[] | null;
  leftIgnoredKgrams: Selection[];
  rightIgnoredKgrams: Selection[];
}
