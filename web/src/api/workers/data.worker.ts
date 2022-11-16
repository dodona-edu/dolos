import { assertType, fileToTokenizedFile } from "@/api/utils";
import {
  Pair,
  Selection,
  Kgram,
  ObjMap,
  Metadata,
  Fragment,
  PairedOccurrence,
  Hash,
} from "@/api/models";
import {
  Fragment as DolosFragment,
  EmptyTokenizer,
  Options,
  Index,
  Region,
  SemanticAnalyzer,
  DecodedSemanticResult,
  PairedSemanticGroups,
  LanguagePicker,
} from "@dodona/dolos-lib";
import * as Comlink from "comlink";

// Parse a list of Dolos fragments into a list of fragment models.
function parseFragments(
  dolosFragments: DolosFragment[],
  kmersMap: Map<Hash, Kgram>
): Fragment[] {
  return dolosFragments.map((dolosFragment: DolosFragment): Fragment => {
    return {
      active: true,
      left: dolosFragment.leftSelection,
      right: dolosFragment.rightSelection,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      data: dolosFragment.mergedData!,
      occurrences: dolosFragment.pairs.map((occurrence): PairedOccurrence => {
        return {
          kgram: assertType(kmersMap.get(occurrence.fingerprint.hash)),
          left: occurrence.left,
          right: occurrence.right,
        };
      }),
    };
  });
}

// Populate the fragments for a given pair.
async function populateFragments(
  pair: Pair,
  metadata: Metadata,
  kgrams: ObjMap<Kgram>,
  occurrences: number[][]
): Promise<Pair> {
  const customOptions = metadata;
  const kmers = kgrams;

  const emptyTokenizer = new EmptyTokenizer(new LanguagePicker().findLanguage(metadata.language));
  const options = new Options(customOptions);
  const index = new Index(emptyTokenizer, options);
  const leftFile = fileToTokenizedFile(pair.leftFile);
  const rightFile = fileToTokenizedFile(pair.rightFile);
  const report = await index.compareTokenizedFiles([leftFile, rightFile]);
  const reportPair = report.scoredPairs[0].pair;

  if (pair.leftFile.semanticMap && pair.rightFile.semanticMap) {
    const [pairedMatches, unpairedMatches] = SemanticAnalyzer.pairMatches(
      leftFile,
      rightFile,
      pair.leftFile.semanticMap.filter(
        (f) => +f.right === +pair.rightFile.id
      ),
      pair.rightFile.semanticMap.filter(
        (f) => +f.right === +pair.leftFile.id
      ),
      occurrences
    );

    pair.pairedMatches = pairedMatches;
    pair.unpairedMatches = unpairedMatches;
  }

  const kmersMap: Map<Hash, Kgram> = new Map();
  for (const kmerKey in kmers) {
    const kmer = kmers[kmerKey];
    kmersMap.set(kmer.hash, kmer);
  }
  pair.fragments = parseFragments(reportPair.fragments(), kmersMap);

  // Check if a given selection is contained within another selection.
  const isContained = (selection: Selection, region: Region): boolean => {
    return Region.firstDiff(
      new Region(selection.startRow, selection.startCol, selection.endRow, selection.endCol),
      [region],
    ) === null;
  };

  // Convert the paired matches into a map of ranges.
  const pairedMatchesMap: Map<PairedSemanticGroups<DecodedSemanticResult>, [Region, Region]> = new Map();
  for (const pairedMatch of pair.pairedMatches) {
    pairedMatchesMap.set(pairedMatch, [
      SemanticAnalyzer.getFullRange(leftFile, pairedMatch.leftMatch),
      SemanticAnalyzer.getFullRange(rightFile, pairedMatch.rightMatch)
    ]);
  }

  // Filter fragments that are not consumed by paired matches.
  // A fragment is consumed by a paired match if both left & right selections
  // are contained within the other paired match.
  const filteredFragments = pair.fragments?.filter((fragment) => {
    const fragmentLeft = fragment.left;
    const fragmentRight = fragment.right;

    return !pair.pairedMatches.some((pairedMatch) => {
      const pairedMatchRegion = pairedMatchesMap.get(pairedMatch);
      if (!pairedMatchRegion) return false;

      const [pairedMatchLeft, pairedMatchRight] = pairedMatchRegion;
      return isContained(fragmentLeft, pairedMatchLeft) && isContained(fragmentRight, pairedMatchRight);
    });
  }) ?? [];

  // Convert the filtered fragments into a list of matches.
  for (const fragment of filteredFragments) {
    pair.matches.push({
      left: fragment.left,
      right: fragment.right,
    });
  }

  // Convert the paired matches into a list of matches.
  for (const pairedMatch of pair.pairedMatches) {
    const pairedMatchRegion = pairedMatchesMap.get(pairedMatch);
    if (!pairedMatchRegion) continue;
    const [pairedMatchLeft, pairedMatchRight] = pairedMatchRegion;

    pair.matches.push({
      left: pairedMatchLeft,
      right: pairedMatchRight,
    });
  }

  return pair;
}

// Populate the semantic matches for a given pair.
async function populateSemantic(pair: Pair, occurrences: number[][]): Promise<Pair> {
  const leftFile = fileToTokenizedFile(pair.leftFile);
  const rightFile = fileToTokenizedFile(pair.rightFile);
  if (!pair.leftFile.semanticMap || !pair.rightFile.semanticMap) return pair;

  const [pairedMatches, unpairedMatches] = SemanticAnalyzer.pairMatches(
    leftFile,
    rightFile,
    pair.leftFile.semanticMap,
    pair.rightFile.semanticMap,
    occurrences
  );

  pair.pairedMatches = pairedMatches;
  pair.unpairedMatches = unpairedMatches;

  return pair;
}

const expose = {
  parseFragments,
  populateFragments,
  populateSemantic,
};

Comlink.expose(expose);

export type DataWorker = typeof expose;
