import { File, Pair } from "@/api/models";

export function parsePairs(pairData: any[], files: File[]): Pair[] {
  const pairs: Pair[] = [];
  for (const row of pairData) {
    const id = parseInt(row.id);
    pairs[id] = {
      id,
      similarity: parseFloat(row.similarity),
      longestFragment: parseFloat(row.longestFragment),
      totalOverlap: parseFloat(row.totalOverlap),
      leftCovered: parseFloat(row.leftCovered),
      rightCovered: parseFloat(row.rightCovered),
      leftFile: files[parseInt(row.leftFileId)],
      rightFile: files[parseInt(row.rightFileId)],
      fragments: null,
      leftIgnoredKgrams: [],
      rightIgnoredKgrams: [],
    };
  }
  return pairs;
}
