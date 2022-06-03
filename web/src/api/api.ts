import * as d3 from "d3";

import {
  CustomOptions,
  EmptyTokenizer,
  File as DolosFile,
  Fragment as DolosFragment,
  Index,
  Options,
  Region,
  TokenizedFile,
  Occurrence,
  NodeStats,
  PairedNodeStats,
  SemanticAnalyzer,
  UnpairedNodeStats
} from "@dodona/dolos-lib";
const DATA_URL = "./data/";

// TODO: replace with actual assertion
function assertType<T>(item: T | undefined | null): T {
  if (item == null) {
    debugger;
    throw new Error("Unexpected undefined");
  }
  return item;
}
type Hash = number;
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

interface FileIndeterminate {
  id: number;
  path: string;
  content: string;
  astAndMappingLoaded: boolean;
  ast: string[] | string;
  mapping: Selection[] | string;
  amountOfKgrams: number;
  /* eslint-disable camelcase */
  extra: {
    timestamp?: Date;
    full_name?: string;
    labels?: string;
  };
  /* eslint-enable camelcase */
}

interface LoadedFile extends FileIndeterminate {
  astAndMappingLoaded: true;
  ast: string[];
  mapping: Selection[];
  semanticMap: Map<number, NodeStats[]>;
}

interface UnloadedFile extends FileIndeterminate {
  astAndMappingLoaded: false;
  ast: string;
  mapping: string;
  semanticMap: Map<number, NodeStats[]>;
}

export type File = LoadedFile | UnloadedFile;

export interface Kgram {
  id: number;
  hash: Hash;
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
  pairedMatches: PairedNodeStats[];
  unpairedMatches: UnpairedNodeStats[];
  leftCovered: number;
  rightCovered: number;
}

export interface Metadata {
  [k: string]: unknown;
}

export interface ApiData {
  files: ObjMap<File>;
  pairs: ObjMap<Pair>;
  kgrams: ObjMap<Kgram>;
  metadata: Metadata;
  occurrences: Occurrence[][];
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

type ParseFilesReturn = {fileMap: ObjMap<File>, occurrences: Occurrence[][]}
async function parseFiles(fileData: d3.DSVRowArray, customOptions: CustomOptions): Promise<ParseFilesReturn> {
  // const start = performance.now();
  // console.log(performance.now() - start);
  const files = fileData.map((row: any) => {
    const file = row as File;
    const extra = JSON.parse(row.extra || "{}");
    extra.timestamp = extra.createdAt && new Date(extra.createdAt);
    file.extra = extra;
    file.ast = JSON.parse(row.ast);
    file.mapping = JSON.parse(row.mapping);
    file.astAndMappingLoaded = true;
    file.amountOfKgrams = file.amountOfKgrams || file.ast.length;

    return file;
  });

  const emptyTokenizer = new EmptyTokenizer();
  const options = new Options(customOptions);
  const index = new Index(emptyTokenizer, options);

  const semanticAnalyzer = new SemanticAnalyzer(index);
  const [occurrences, results] = await semanticAnalyzer.semanticAnalysis(files.map(f => fileToTokenizedFile(f)));

  for (let i = 0; i < files.length; i++) {
    files[i].semanticMap = results[i];
  }
  return { fileMap: Object.fromEntries(files.map(f => [f.id, f])), occurrences };
}

function parseFragments(dolosFragments: DolosFragment[], kmersMap: Map<Hash, Kgram>): Fragment[] {
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
          kgram: assertType(kmersMap.get(occurrence.fingerprint.hash)),
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
      const leftCovered = parseFloat(assertType((row.leftCovered)));
      const rightCovered = parseFloat(assertType((row.rightCovered)));

      const diff = {
        id,
        similarity,
        longestFragment,
        totalOverlap,
        leftFile: files[parseInt(assertType(row.leftFileId))],
        rightFile: files[parseInt(assertType(row.rightFileId))],
        fragments: null,
        pairedMatches: [],
        unpairedMatches: [],
        leftCovered,
        rightCovered
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
  { type: "number"; value: number} |
  { type: "object"; value: null }

function castToType(row: d3.DSVRowString): MetaRowType {
  const rowValue = row.value;
  const rowType = row.type;
  const newRow = row as MetaRowType;
  if (rowType === "boolean") {
    newRow.value = rowValue ? rowValue.toLowerCase() === "true" : false;
  } else if (rowValue && rowType === "number") {
    newRow.value = Number.parseFloat(rowValue);
  } else if (rowType === "object") {
    newRow.value = null;
  }
  return newRow;
}

function parseMetadata(data: d3.DSVRowArray): Metadata {
  return Object.fromEntries(
    data.map(row => [row.property, castToType(row).value])
  );
}

export function fileToTokenizedFile(file: File): TokenizedFile {
  const dolosFile = new DolosFile(file.path, file.content, undefined, file.id);
  if (file.astAndMappingLoaded) {
    return new TokenizedFile(dolosFile, file.ast, file.mapping as Region[]);
  } else {
    throw new Error("File AST and mapping not parsed");
  }
}

export async function loadFragments(
  pair: Pair, kmers: ObjMap<Kgram>, customOptions: CustomOptions, occurrences: Occurrence[][]
): Promise<void> {
  const emptyTokenizer = new EmptyTokenizer();
  const options = new Options(customOptions);
  const index = new Index(emptyTokenizer, options);
  const leftFile = fileToTokenizedFile(pair.leftFile);
  const rightFile = fileToTokenizedFile(pair.rightFile);
  const report = await index.compareTokenizedFiles(
    [leftFile, rightFile]
  );
  const reportPair = report.scoredPairs[0].pair;

  const [pairedMatches, unpairedMatches] = SemanticAnalyzer.pairMatches(
    leftFile,
    rightFile,
    pair.leftFile.semanticMap.get(pair.rightFile.id) || [],
    pair.rightFile.semanticMap.get(pair.leftFile.id) || [],
    occurrences
  );

  const totalMatch = (s: NodeStats): number =>
    (s.matchedNodeAmount.get(pair.leftFile.id) || 0) + (s.childrenMatch.get(pair.leftFile.id) || 0);

  pair.pairedMatches = pairedMatches.filter(pm => totalMatch(pm.rightMatch) >= 5);
  pair.unpairedMatches = unpairedMatches;

  const kmersMap: Map<Hash, Kgram> = new Map();
  for (const kmerKey in kmers) {
    const kmer = kmers[kmerKey];
    kmersMap.set(kmer.hash, kmer);
  }
  pair.fragments = parseFragments(reportPair.fragments(), kmersMap);
}

export async function loadSemantic(
  pair: Pair, occurrences: Occurrence[][]
): Promise<void> {
  const leftFile = fileToTokenizedFile(pair.leftFile);
  const rightFile = fileToTokenizedFile(pair.rightFile);

  const [pairedMatches, unpairedMatches] = SemanticAnalyzer.pairMatches(
    leftFile,
    rightFile,
    pair.leftFile.semanticMap.get(pair.rightFile.id) || [],
    pair.rightFile.semanticMap.get(pair.leftFile.id) || [],
    occurrences
  );

  const totalMatch = (s: NodeStats): number =>
    (s.matchedNodeAmount.get(pair.leftFile.id) || 0) + (s.childrenMatch.get(pair.leftFile.id) || 0);

  pair.pairedMatches = pairedMatches.filter(pm => totalMatch(pm.rightMatch) >= 5);
  pair.unpairedMatches = unpairedMatches;
}

export async function fetchData(customOptions: CustomOptions): Promise<ApiData> {
  const kgramPromise = fetchKgrams();
  const filePromise = fetchFiles();
  const metadataPromise = fetchMetadata();
  const pairPromise = fetchPairs();

  const { fileMap, occurrences } = await parseFiles(await filePromise, customOptions);
  const kgrams = parseKgrams(await kgramPromise, fileMap);
  const pairs = parsePairs(await pairPromise, fileMap, kgrams);
  const metadata = parseMetadata(await metadataPromise);

  return { files: fileMap, kgrams, pairs, metadata, occurrences };
}
