import * as d3 from "d3";
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

export interface File {
  id: number;
  path: string;
  content: string;
  ast: string;
  /* eslint-disable camelcase */
  extra: {
    timestamp?: Date;
    full_name?: string;
    labels?: string;
  };
  /* eslint-enable camelcase */
}

export interface Selection {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
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
  data: string;
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
  url = DATA_URL + "/files.csv"
): Promise<d3.DSVRowArray> {
  return await d3.csv(url);
}

async function fetchPairs(
  url = DATA_URL + "/pairs.csv"
): Promise<d3.DSVRowArray> {
  return await d3.csv(url);
}

async function fetchKgrams(
  url = DATA_URL + "/kgrams.csv"
): Promise<d3.DSVRowArray> {
  return await d3.csv(url);
}

async function fetchMetadata(
  url = DATA_URL + "/metadata.csv"
): Promise<d3.DSVRowArray> {
  return await d3.csv(url);
}

async function fetchFragments(
  pairId: number,
  url = DATA_URL + "/fragments/"
): Promise<string> {
  return await d3.text(url + pairId + ".json");
}

function parseFiles(fileData: d3.DSVRowArray): ObjMap<File> {
  return Object.fromEntries(
    fileData.map(row => {
      const extra = JSON.parse(row.extra || "{}");
      extra.timestamp = extra.createdAt && new Date(extra.createdAt);
      row.extra = extra;
      return [row.id, row];
    })
  );
}

function parseFragments(fragmentsJson: string, kgrams: ObjMap<Kgram>): Fragment[] {
  const parsed = JSON.parse(fragmentsJson);
  return parsed.map((fragmentData: any): Fragment => {
    return {
      active: true,
      left: fragmentData.leftSelection,
      right: fragmentData.rightSelection,
      data: fragmentData.data,
      occurrences: fragmentData.pairedOccurrences.map((occurrence: any): PairedOccurrence => {
        return {
          kgram: kgrams[occurrence.sharedFingerprint],
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

function parseMetadata(data: d3.DSVRowArray): Metadata {
  return Object.fromEntries(
    data.map(row => [row.property, row.value])
  );
}

export async function loadFragments(pair: Pair, kmers: ObjMap<Kgram>): Promise<void> {
  const fragments = fetchFragments(pair.id);
  pair.fragments = parseFragments(await fragments, kmers);
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
