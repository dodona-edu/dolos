import { analyzePair, type Match } from "dolos-core-wasm";
import { AnalysisData, Fragment, Interval, Region, Selection } from "@/api/models";

// The fragments and the ignored regions of a pair.
export interface PairFragments {
  fragments: Fragment[];
  leftIgnored: Selection[];
  rightIgnored: Selection[];
}

// Selection from the start of the fingerprint at `start` to the end of the fingerprint at `end - 1`.
function spanSelection(regions: Region[], start: number, end: number): Selection {
  const [startRow, startCol] = regions[start];
  const [, , endRow, endCol] = regions[end - 1];
  return { startRow, startCol, endRow, endCol };
}

// Convert the matches of `analyzePair` into fragments.
export function matchesToFragments(
  matches: Match[],
  leftRegions: Region[],
  rightRegions: Region[]
): Fragment[] {
  return matches.map((match) => ({
    left: spanSelection(leftRegions, match.leftStart, match.leftStart + match.length),
    right: spanSelection(rightRegions, match.rightStart, match.rightStart + match.length),
    length: match.length,
  }));
}

// Convert the ignored intervals of a file into one selection per non-empty interval.
export function ignoredSelections(intervals: Interval[], regions: Region[]): Selection[] {
  return intervals
    .filter(([start, end]) => start < end)
    .map(([start, end]) => spanSelection(regions, start, end));
}

/**
 * Compare two files with `analyzePair` and build their fragments and ignored regions.
 * The WebAssembly module must be initialised.
 */
export function comparePair(
  left: AnalysisData,
  right: AnalysisData,
  minMatchLength: number
): PairFragments {
  const toSequence = (data: AnalysisData) => ({
    fingerprints: data.fingerprints,
    ignored: data.ignored.map(([start, end]) => ({ start, end })),
  });
  const { matches } = analyzePair(toSequence(left), toSequence(right), { minMatchLength });

  return {
    fragments: matchesToFragments(matches, left.regions, right.regions),
    leftIgnored: ignoredSelections(left.ignored, left.regions),
    rightIgnored: ignoredSelections(right.ignored, right.regions),
  };
}
