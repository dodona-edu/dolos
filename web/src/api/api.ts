import * as d3 from "d3";
// import { assertType } from "typescript-is";

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
}

export interface Selection {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export interface PairedOccurrence {
  kmer: Kmer;
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

export interface Hunk {
  left: Selection;
  right: Selection;
  data: string;
  matches: PairedOccurrence[];
}

export interface Diff {
  id: number;
  leftFile: File;
  rightFile: File;
  similarity: number;
  continuousOverlap: number;
  totalOverlap: number;
  fragments: Hunk[];
}

export interface Kmer {
  id: number;
  hash: number;
  data: string;
  files: File[];
}

export interface Metadata {
  [k: string]: unknown;
}

export interface ApiData {
  files: ObjMap<File>;
  diffs: ObjMap<Diff>;
  kmers: ObjMap<Kmer>;
  metadata: Metadata;
}

async function fetchFiles(
  url = "/data/files.csv"
): Promise<d3.DSVRowArray> {
  return await d3.csv(url);
}

async function fetchIntersections(
  url = "/data/intersections.csv"
): Promise<d3.DSVRowArray> {
  return await d3.csv(url);
}

async function fetchKmers(
  url = "/data/kmers.csv"
): Promise<d3.DSVRowArray> {
  return await d3.csv(url);
}

async function fetchMetadata(
  url = "/data/metadata.csv"
): Promise<d3.DSVRowArray> {
  return await d3.csv(url);
}

function parseFiles(fileData: d3.DSVRowArray): ObjMap<File> {
  return Object.fromEntries(fileData.map(row => [row.id, row]));
}

function parseFragments(fragmentsJson: string, kmers: ObjMap<Kmer>): Hunk[] {
  const parsed = JSON.parse(fragmentsJson);
  return parsed.map((fragmentData: any): Hunk => ({
    left: fragmentData.leftSelection,
    right: fragmentData.rightSelection,
    data: fragmentData.data,
    matches: fragmentData.matches.map((matchData: any): PairedOccurrence => ({
      kmer: kmers[matchData.sharedKmer],
      left: matchData.left,
      right: matchData.rid
    }))
  }));
}

function parseIntersections(
  intersectionData: d3.DSVRowArray,
  files: ObjMap<File>,
  kmers: ObjMap<Kmer>,
): ObjMap<Diff> {
  return Object.fromEntries(
    intersectionData.map(row => {
      const id = parseInt(assertType(row.id));
      const similarity = parseFloat(assertType(row.similarity));
      const continuousOverlap = parseFloat(assertType(row.continuousOverlap));
      const totalOverlap = parseFloat(assertType(row.totalOverlap));

      const fragments: Hunk[] = parseFragments(assertType(row.fragments), kmers);
      const intersection = {
        id,
        similarity,
        continuousOverlap,
        totalOverlap,
        fragments,
        leftFile: files[parseInt(assertType(row.leftFileId))],
        rightFile: files[parseInt(assertType(row.rightFileId))],
      };
      return [id, intersection];
    })
  );
}

function parseKmers(kmerData: d3.DSVRowArray, fileMap: ObjMap<File>): ObjMap<Kmer> {
  return Object.fromEntries(kmerData.map(row => {
    const id = parseInt(assertType(row.id));
    const fileIds: number[] = assertType(JSON.parse(assertType(row.files)));
    const files: File[] = fileIds.map(id => fileMap[id]);
    const kmer = {
      id,
      hash: parseInt(assertType(row.hash)),
      data: assertType(row.data),
      files,
    };
    return [id, kmer];
  }));
}

function parseMetadata(data: d3.DSVRowArray): Metadata {
  return Object.fromEntries(
    data.map(row => [row.property, row.value])
  );
}

export async function fetchData(): Promise<ApiData> {
  const kmerPromise = fetchKmers();
  const filePromise = fetchFiles();
  const metadataPromise = fetchMetadata();
  const intersectionPromise = fetchIntersections();

  const files = parseFiles(await filePromise);
  const kmers = parseKmers(await kmerPromise, files);
  const diffs = parseIntersections(await intersectionPromise, files, kmers);
  const metadata = parseMetadata(await metadataPromise);

  return { files, kmers, diffs: diffs, metadata };
}
