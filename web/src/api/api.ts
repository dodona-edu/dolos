import * as d3 from "d3";

import {
  File as DolosFile,
  Region,
  TokenizedFile,
  Fragment as DolosFragment,
  Index,
  EmptyTokenizer, CustomOptions, Options
} from "@dodona/dolos-lib";
// import { assertType } from "typescript-is";

const DATA_URL = "./data/";

// TODO: replace with actual assertion
function assertType<T>(item: T | undefined | null): T {
  if (item == null) {
    debugger;
    throw new Error("Unexpected undefined");
  }
  return item;
}

/**
 * Simple interface for plain javascript objects with numeric keys.
 */
export interface ObjMap<T> {
  [id: number]: T;
}

export interface Selection {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export interface File {
  id: number;
  path: string;
  content: string;
  ast: string[];
  mapping: Selection[];
  /* eslint-disable camelcase */
  extra: {
    timestamp?: Date;
    full_name?: string;
    labels?: string;
  };
  /* eslint-enable camelcase */
}

export interface Kgram {
  id: number;
  hash: number;
  data: string;
  files: File[];
}

export interface PairedOccurrence {
  kgram: Kgram;
  left: {
    start: number;
    stop: number;
    index: number;
  };
  right: {
    start: number;
    stop: number;
    index: number;
  };
}

export interface Fragment {
  left: Selection;
  right: Selection;
  data: string[];
  occurrences: PairedOccurrence[];
  active: boolean;
}

export interface Pair {
  id: number;
  leftFile: File;
  rightFile: File;
  similarity: number;
  longestFragment: number;
  totalOverlap: number;
  fragments: Array<Fragment> | null;
}

export interface Metadata {
  [k: string]: unknown;
}

export interface ApiData {
  files: ObjMap<File>;
  pairs: ObjMap<Pair>;
  kgrams: ObjMap<Kgram>;
  metadata: Metadata;

}

async function fetchFiles(
  url = DATA_URL + "files.csv"
): Promise<d3.DSVRowArray> {
  return await d3.csv(url);
}

async function fetchPairs(
  url = DATA_URL + "pairs.csv"
): Promise<d3.DSVRowArray> {
  return await d3.csv(url);
}

async function fetchKgrams(
  url = DATA_URL + "kgrams.csv"
): Promise<d3.DSVRowArray> {
  return await d3.csv(url);
}

async function fetchMetadata(
  url = DATA_URL + "metadata.csv"
): Promise<d3.DSVRowArray> {
  return await d3.csv(url);
}

function parseFiles(fileData: d3.DSVRowArray): ObjMap<File> {
  return Object.fromEntries(
    fileData.map(row => {
      const extra = JSON.parse(row.extra || "{}");
      extra.timestamp = extra.createdAt && new Date(extra.createdAt);
      row.extra = extra;
      row.mapping = JSON.parse(row.mapping || "[]");
      row.ast = JSON.parse(row.ast || "[]");
      return [row.id, row];
    })
  );
}

function parseFragments(dolosFragments: DolosFragment[], hashToKmer: ObjMap<Kgram>): Fragment[] {
  // const parsed = JSON.parse(fragmentsJson);
  return dolosFragments.map((dolosFragment: DolosFragment): Fragment => {
    return {
      active: true,
      left: dolosFragment.leftSelection,
      right: dolosFragment.rightSelection,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      data: dolosFragment.mergedData!,
      occurrences: dolosFragment.pairs.map((occurrence): PairedOccurrence => {
        return {
          kgram: hashToKmer[occurrence.fingerprint.hash],
          left: occurrence.left,
          right: occurrence.right
        };
      })
    };
  });
}

function parsePairs(
  pairData: d3.DSVRowArray,
  files: ObjMap<File>,
  kgrams: ObjMap<Kgram>
): ObjMap<Pair> {
  return Object.fromEntries(
    pairData.map(row => {
      const id = parseInt(assertType(row.id));
      const similarity = parseFloat(assertType(row.similarity));
      const longestFragment = parseFloat(assertType(row.longestFragment));
      const totalOverlap = parseFloat(assertType(row.totalOverlap));

      const diff = {
        id,
        similarity,
        longestFragment,
        totalOverlap,
        leftFile: files[parseInt(assertType(row.leftFileId))],
        rightFile: files[parseInt(assertType(row.rightFileId))],
        fragments: null
      };
      return [id, diff];
    })
  );
}

function parseKgrams(kgramData: d3.DSVRowArray, fileMap: ObjMap<File>): ObjMap<Kgram> {
  return Object.fromEntries(kgramData.map(row => {
    const id = parseInt(assertType(row.id));
    const fileIds: number[] = assertType(JSON.parse(assertType(row.files)));
    const files: File[] = fileIds.map(id => fileMap[id]);
    const kgram = {
      id,
      hash: parseInt(assertType(row.hash)),
      data: assertType(row.data),
      files,
    };
    return [id, kgram];
  }));
}

type MetaRowType = { type: "string"; value: string } |
  { type: "boolean"; value: boolean } |
  { type: "number"; value: number}

function castToType(row: d3.DSVRowString): MetaRowType {
  const rowValue = row.value;
  const rowType = row.type;
  const newRow = row as MetaRowType;
  if (!rowValue) {
    return newRow as MetaRowType;
  }
  switch (rowType) {
  case "string":
    newRow.value = Number.parseFloat(rowValue);
    break;
  case "boolean":
    newRow.value = rowValue.toLowerCase() === "true";
    break;
  }
  return newRow;
}

function parseMetadata(data: d3.DSVRowArray): Metadata {
  return Object.fromEntries(
    data.map(row => [row.property, castToType(row).value])
  );
}

function fileToTokenizedFile(file: File): TokenizedFile {
  const dolosFile = new DolosFile(file.path, file.content);
  return new TokenizedFile(dolosFile, file.ast, file.mapping as Region[]);
}

export async function loadFragments(pair: Pair, kmers: ObjMap<Kgram>, customOptions: CustomOptions): Promise<void> {
  const emptyTokenizer = new EmptyTokenizer();
  const options = new Options(customOptions);
  const index = new Index(emptyTokenizer, options);
  const report = await index.compareTokenizedFiles(
    [fileToTokenizedFile(pair.leftFile), fileToTokenizedFile(pair.rightFile)]
  );
  const reportPair = report.scoredPairs[0].pair;
  const hashToKmers: ObjMap<Kgram> = {};
  for (const kmerKey in kmers) {
    const kmer = kmers[kmerKey];
    hashToKmers[kmer.hash] = kmer;
  }
  pair.fragments = parseFragments(reportPair.fragments(), hashToKmers);
}

export async function fetchData(): Promise<ApiData> {
  const kgramPromise = fetchKgrams();
  const filePromise = fetchFiles();
  const metadataPromise = fetchMetadata();
  const pairPromise = fetchPairs();

  const files = parseFiles(await filePromise);
  const kgrams = parseKgrams(await kgramPromise, files);
  const pairs = parsePairs(await pairPromise, files, kgrams);
  const metadata = parseMetadata(await metadataPromise);

  return { files, kgrams, pairs, metadata };
}
