import { File, Fragment } from "@/api/models";

export interface Pair {
  id: number;
  leftFile: File;
  rightFile: File;
  similarity: number;
  longestFragment: number;
  totalOverlap: number;
  fragments: Array<Fragment> | null;
  leftCovered: number;
  rightCovered: number;
}
