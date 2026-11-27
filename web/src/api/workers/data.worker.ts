import init from "dolos-core-wasm";
import { AnalysisData } from "@/api/models";
import { comparePair, PairFragments } from "@/api/utils/fragments";

const ready = init();

// Compare two files and return their fragments and ignored regions.
export async function compareFiles(
  left: AnalysisData,
  right: AnalysisData,
  minMatchLength: number
): Promise<PairFragments> {
  await ready;
  return comparePair(left, right, minMatchLength);
}
