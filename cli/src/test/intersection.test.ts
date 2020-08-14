import test from "ava";
import { File } from "../lib/file/file";
import { TokenizedFile } from "../lib/file/tokenizedFile";
import { Diff } from "../lib/analyze/diff";
import { Region } from "../lib/util/region";
import { SharedKmer } from "../lib/analyze/sharedKmer";
import { PairedOccurrence } from "../lib/analyze/pairedOccurrence";

function createFakeFile(name: string): TokenizedFile {
  return new TokenizedFile(
    new File(name, "content"),
    "(program)",
    []
  )
}

function createIntersection(): Diff {
  const f1 = createFakeFile("file1");
  const f2 = createFakeFile("file2");
  return new Diff(f1, f2);
}

test("match merging & squashing", t => {
  const int = createIntersection();

  let kmer = new SharedKmer(1, "kmer 1");
  const biggerTopLeft = [];
  // bigger match
  for(let i = 0; i < 10; i++) {
    const match = new PairedOccurrence(
      {
        index: i,
        start: i,
        stop: i + 1,
        location: new Region(i, 0, i + 1, 0),
        data: "lines 0 - 10",
      },
      {
        index: 20 + i,
        start: 20 + i,
        stop: 20 + i + 1,
        location: new Region(20 + i, 0, 20 + i + 1, 0),
        data: "lines 20 - 30",
      },
      kmer
    );
    int.addMatch(match)
    t.is(1, int.fragments().length);
    biggerTopLeft.push(match);
  }

  // contained match
  kmer = new SharedKmer(2, "kmer 2");
  const topLeftContained = new PairedOccurrence(
    {
      index: 5,
      start: 5 + 1,
      stop: 5 + 2,
      location: new Region(5, 0, 6, 0),
      data: "small match line 5",
    },
    {
      index: 25,
      start: 25 + 1,
      stop: 25 + 2,
      location: new Region(25, 0, 26, 0),
      data: "small match line 25",
    },
    kmer
  );
  int.addMatch(topLeftContained);
  t.is(2, int.fragments().length);

  // bigger match, same location
  const biggerMiddle = [];
  kmer = new SharedKmer(3, "kmer 3");
  for(let i = 0; i < 10; i++) {
    const match = new PairedOccurrence(
      {
        index: 10 + i,
        start: 10 + i + 1,
        stop: 10 + i + 2,
        location: new Region(10 + i, 0, 10 + i + 1, 0),
        data: "lines 10 - 20",
      },
      {
        index: 20 + i,
        start: 20 + i + 1,
        stop: 20 + i + 2,
        location: new Region(10 + i, 0, 10 + i + 1, 0),
        data: "lines 10 - 20",
      },
      kmer
    );
    biggerMiddle.push(match);
    int.addMatch(match);
    t.is(3, int.fragments().length);
  }

  // bigger match
  const  biggerBottomLeft = [];
  kmer = new SharedKmer(4, "kmer 4");
  for(let i = 0; i < 10; i++) {
    const match = new PairedOccurrence(
      {
        index: 20 + i,
        start: 20 + i + 1,
        stop: 20 + i + 2,
        location: new Region(20 + i, 0, 20 + i + 1, 0),
        data: "lines 20 - 30",
      },
      {
        index: i,
        start: i + 1,
        stop: i + 2,
        location: new Region(i, 0, i + 1, 0),
        data: "lines 0 - 10",
      },
      kmer
    );
    biggerBottomLeft.push(match);
    int.addMatch(match);
    t.is(4, int.fragments().length);
  }

  // contained match
  kmer = new SharedKmer(5, "kmer 5");
  const bottomLeftContained = new PairedOccurrence(
    {
      index: 25,
      start: 25 + 1,
      stop: 25 + 2,
      location: new Region(25, 0, 26, 0),
      data: "small match line 25",
    },
    {
      index: 5,
      start: 5 + 1,
      stop: 5 + 2,
      location: new Region(5, 0, 6, 0),
      data: "small match line 5",
    },
    kmer
  );
  int.addMatch(bottomLeftContained);
  t.is(5, int.fragments().length);

  // match not contained
  kmer = new SharedKmer(6, "kmer 6");
  const notContained = new PairedOccurrence(
    {
      index: 5,
      start: 5 + 1,
      stop: 5 + 2,
      location: new Region(5, 0, 6, 0),
      data: "not contained match line 5",
    },
    {
      index: 5,
      start: 5 + 1,
      stop: 5 + 2,
      location: new Region(5, 0, 6, 0),
      data: "not contained match line 5",
    },
    kmer
  );
  int.addMatch(notContained);

  let fragments = int.fragments();
  t.is(6, fragments.length);

  t.deepEqual(biggerTopLeft, fragments[0].pairedOccurrences);
  t.deepEqual([topLeftContained], fragments[1].pairedOccurrences);
  t.deepEqual([notContained], fragments[2].pairedOccurrences);
  t.deepEqual(biggerMiddle, fragments[3].pairedOccurrences);
  t.deepEqual(biggerBottomLeft, fragments[4].pairedOccurrences);
  t.deepEqual([bottomLeftContained], fragments[5].pairedOccurrences);

  int.squash();

  fragments = int.fragments();

  t.is(4, fragments.length, "squashed too many");
  t.deepEqual(biggerTopLeft, fragments[0].pairedOccurrences)
  t.deepEqual([notContained], fragments[1].pairedOccurrences)
  t.deepEqual(biggerMiddle, fragments[2].pairedOccurrences)
  t.deepEqual(biggerBottomLeft, fragments[3].pairedOccurrences)

});
