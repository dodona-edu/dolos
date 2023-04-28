import { File, Fragment } from "@/api/models";

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
}
