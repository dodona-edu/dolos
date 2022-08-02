import { EncodedSemanticResult } from "@dodona/dolos-lib";

export interface Semantic {
  occurrences: number[][];
  semanticMapResults: EncodedSemanticResult[];
}
