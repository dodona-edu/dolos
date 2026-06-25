import { fileToTokenizedFile } from "@/api/utils";
import {
  File,
  Pair,
  Kgram,
  Metadata,
  Fragment,
  PairedOccurrence,
  Hash,
} from "@/api/models";
import { Fragment as DolosFragment, FingerprintIndex, TokenizedFile, Pair as DolosPair } from "@dodona/dolos-core";

// Parse a list of Dolos fragments into a list of fragment models.
export function parseFragments(
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
        const kgram = kmersMap.get(occurrence.fingerprint.hash);
        if (kgram === undefined) {
          throw new Error(`Kgram hash not found: ${occurrence}`);
        }
        return {
          kgram,
          left: occurrence.left,
          right: occurrence.right,
        };
      }),
    };
  });
}

function getIgnoredKgrams(reportPair: DolosPair, leftFile: TokenizedFile, rightFile: TokenizedFile) {
  const leftIgnoredKgrams = [];
  const rightIgnoredKgrams = [];

  for (const ignoredKgram of reportPair.leftEntry.ignored) {
    const occurrences = ignoredKgram.occurrencesOf(leftFile);
    if (occurrences.length > 0) {
      leftIgnoredKgrams.push(occurrences[0].side.location);
    }
  }

  for (const ignoredKgram of reportPair.rightEntry.ignored) {
    const occurrences = ignoredKgram.occurrencesOf(rightFile);
    if (occurrences.length > 0) {
      rightIgnoredKgrams.push(occurrences[0].side.location);
    }
  }

  return {
    leftIgnoredKgrams,
    rightIgnoredKgrams
  };
}

// Populate the fragments for a given pair.
export function populateFragments(
  pair: Pair,
  metadata: Metadata,
  kgrams: Kgram[],
  ignoredKgrams: Kgram[],
  ignoredFile?: File,
): Pair {
  const customOptions = metadata;
  const kmers = kgrams;

  const index = new FingerprintIndex(customOptions.kgramLength, customOptions.kgramsInWindow);
  const leftFile = fileToTokenizedFile(pair.leftFile);
  const rightFile = fileToTokenizedFile(pair.rightFile);
  index.addFiles([leftFile, rightFile]);
  if (ignoredFile) {
    const ignored = fileToTokenizedFile(ignoredFile);
    index.addIgnoredFile(ignored);
  }
  index.addIgnoredHashes(ignoredKgrams.map(k => k.hash));
  const reportPair = index.getPair(leftFile, rightFile);

  const kmersMap: Map<Hash, Kgram> = new Map();
  for (const kmerKey in kmers) {
    const kmer = kmers[kmerKey];
    kmersMap.set(kmer.hash, kmer);
  }
  const ignoredKgramsMap = getIgnoredKgrams(reportPair, leftFile, rightFile);

  pair.fragments = parseFragments(reportPair.buildFragments(), kmersMap);
  pair.leftIgnoredKgrams = ignoredKgramsMap.leftIgnoredKgrams;
  pair.rightIgnoredKgrams = ignoredKgramsMap.rightIgnoredKgrams;
  return pair;
}
