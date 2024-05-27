import test from "ava";
import { File } from "../file/file.js";
import { TokenizedFile } from "../file/tokenizedFile.js";
import { Pair } from "../algorithm/pair.js";
import { Region } from "../util/region.js";
import { Range } from "../util/range.js";
import { SharedFingerprint } from "../algorithm/sharedFingerprint.js";
import { FileEntry, Occurrence } from "../algorithm/fingerprintIndex.js";
function createFakeFile(name: string): TokenizedFile {
  return new TokenizedFile(
    new File(name, "content"),
    ["(", "program", ")"],
    []
  );
}

function createOccurrence(entry: FileEntry, index: number): Occurrence {
  return {
    file: entry.file,
    side: {
      index,
      start: -1,
      stop: -1,
      location: new Region(0, 0, 0, 0),
      data: null,
    }
  };
}

test("paired occurrence merging & squashing", t => {
  /* This test creates the following scenario for the fragments of a pair,
   * where the first column is the kgram index in the left and right files and
   * the other columns show the hash (number) of the fragment matching.
   *
   * idx| Left    | Right
   * ---------------------
   * 0  | A 1     | E 3 5
   * 1  | B 1 2   | F 3 5
   * 2  | C   2   | -
   * 3  | D   2 8 | A 1 4
   * 4  | B   2   | B 1 4
   * 5  | C   2   | -
   * 6  | E 3     | B 2 6
   * 7  | F 3     | C 2
   * 8  | -       | D 2
   * 9  | A 4     | B 2 7
   * 10 | B 4 6 7 | C 2
   * 11 | E 5     | D 8
   * 12 | F 5     |
   */
  const leftFile = createFakeFile("file1.js");
  const rightFile = createFakeFile("file2.js");

  const left = {
    kgrams: new Array<Range>(),
    shared: new Set<SharedFingerprint>(),
    ignored: new Set<SharedFingerprint>(),
    file: leftFile,
    isIgnored: false,
  };

  const right = {
    kgrams: new Array<Range>(),
    shared: new Set<SharedFingerprint>(),
    ignored: new Set<SharedFingerprint>(),
    file: rightFile,
    isIgnored: false,
  };


  const shared = {
    a: new SharedFingerprint(1, null),
    b: new SharedFingerprint(2, null),
    c: new SharedFingerprint(3, null),
    d: new SharedFingerprint(4, null),
    e: new SharedFingerprint(5, null),
    f: new SharedFingerprint(6, null)
  };

  left.kgrams.push(...new Array<Range>(13).fill(new Range(0, 1)));
  right.kgrams.push(...new Array<Range>(12).fill(new Range(0, 1)));

  for (const fingerprint of Object.values(shared)) {
    left.shared.add(fingerprint);
    right.shared.add(fingerprint);
  }

  shared.a.addAll([
    createOccurrence(left, 0),
    createOccurrence(left, 9),
    createOccurrence(right, 3),
  ]);
  shared.b.addAll([
    createOccurrence(left, 1),
    createOccurrence(left, 4),
    createOccurrence(left, 10),
    createOccurrence(right, 4),
    createOccurrence(right, 6),
    createOccurrence(right, 9),
  ]);
  shared.c.addAll([
    createOccurrence(left, 2),
    createOccurrence(left, 5),
    createOccurrence(right, 7),
    createOccurrence(right, 10),
  ]);
  shared.d.addAll([
    createOccurrence(left, 3),
    createOccurrence(right, 8),
    createOccurrence(right, 11),
  ]);
  shared.e.addAll([
    createOccurrence(left, 6),
    createOccurrence(left, 11),
    createOccurrence(right, 0),
  ]);
  shared.f.addAll([
    createOccurrence(left, 7),
    createOccurrence(left, 12),
    createOccurrence(right, 1),
  ]);

  const pair = new Pair(left, right);

  t.is(pair.leftCovered, 12);
  t.is(pair.rightCovered, 10);
  t.is(pair.leftTotal, 13);
  t.is(pair.rightTotal, 12);
  t.is(pair.overlap, 22);
  t.is(pair.similarity, .88);
  t.is(pair.longest, 5);


});



