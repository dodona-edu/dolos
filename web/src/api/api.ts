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

export interface FileMap {
 [id: number]: File;
}

export interface File {
  id: number;
  path: string;
  content: string;
  ast: string;
}

export interface Intersection {
  id: number;
  leftFile: File;
  rightFile: File;
  similarity: number;
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
  files: File[];
  intersections: Intersection[];
  kmers: Kmer[];
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
  url = "/data/sharedKmers.csv"
): Promise<d3.DSVRowArray> {
  return await d3.csv(url);
}

async function fetchMetadata(
  url = "/data/metadata.csv"
): Promise<d3.DSVRowArray> {
  return await d3.csv(url);
}

function parseFiles(fileData: d3.DSVRowArray): FileMap {
  return Object.fromEntries(fileData.map(row => [row.id, row]));
}

function parseIntersections(
  intersectionData: d3.DSVRowArray,
  files: FileMap,
): Intersection[] {
  return intersectionData.map(row => {
    const id = parseInt(assertType(row.id));
    const similarity = parseFloat(assertType(row.similarity));
    return {
      id,
      similarity,
      leftFile: files[parseInt(assertType(row.leftFileId))],
      rightFile: files[parseInt(assertType(row.rightFileId))],
    };
  });
}

function parseKmers(kmerData: d3.DSVRowArray, fileMap: FileMap): Kmer[] {
  return kmerData.map(row => {
    const fileIds: number[] = assertType(JSON.parse(assertType(row.files)));
    const files: File[] = fileIds.map(id => fileMap[id]);
    return {
      id: parseInt(assertType(row.id)),
      hash: parseInt(assertType(row.hash)),
      data: assertType(row.data),
      files,
    };
  });
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

  const fileMap = parseFiles(await filePromise);

  return {
    files: Object.values(fileMap),
    metadata: parseMetadata(await metadataPromise),
    kmers: parseKmers(await kmerPromise, fileMap),
    intersections: parseIntersections(await intersectionPromise, fileMap),
  };
}
