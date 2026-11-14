import { File, Pair } from "@/api/models";

export function parsePairs(pairData: any[], files: File[]): Pair[] {
  const pairs: Pair[] = [];
  for (const row of pairData) {
    const id = parseInt(row.id);
    pairs[id] = {
      id,
      similarity: parseFloat(row.similarity),
      longestFragment: parseInt(row.longestFragment),
      totalOverlap: parseInt(row.totalOverlap),
      leftCovered: parseInt(row.overlapLeft),
      rightCovered: parseInt(row.overlapRight),
      leftTotal: parseInt(row.totalLeft),
      rightTotal: parseInt(row.totalRight),
      leftFile: files[parseInt(row.leftFileId)],
      rightFile: files[parseInt(row.rightFileId)],
      fragments: null,
      leftIgnoredKgrams: [],
      rightIgnoredKgrams: [],
    };
  }
  return pairs;
}
