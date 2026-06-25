import { File, Pair, Label } from "@/api/models";

/**
 * Minimal fixture factories for the pure-logic regression suite.
 *
 * These build just enough of the real `File`/`Pair` shapes to exercise the
 * data-transformation and clustering functions. They are deliberately decoupled
 * from CSV parsing and Pinia.
 */

const defaultLabel: Label = {
  label: "label",
  selected: true,
  color: "#000000",
} as unknown as Label;

export function createFile(id: number, overrides: Partial<File> = {}): File {
  const path = overrides.path ?? `submissions/file-${id}.js`;
  return {
    id,
    path,
    shortPath: path,
    content: "",
    astAndMappingLoaded: true,
    ast: [],
    mapping: [],
    amountOfKgrams: 0,
    ignored: false,
    label: defaultLabel,
    extra: {},
    pseudo: { path, shortPath: path },
    original: { path, shortPath: path },
    ...overrides,
  } as File;
}

export function createPair(
  id: number,
  leftFile: File,
  rightFile: File,
  similarity: number,
  overrides: Partial<Pair> = {}
): Pair {
  return {
    id,
    leftFile,
    rightFile,
    similarity,
    longestFragment: 0,
    totalOverlap: 0,
    leftCovered: 0,
    rightCovered: 0,
    fragments: null,
    leftIgnoredKgrams: [],
    rightIgnoredKgrams: [],
    ...overrides,
  };
}
