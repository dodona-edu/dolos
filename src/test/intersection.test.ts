import test from "ava";
import { File } from "../lib/file/file";
import { TokenizedFile } from "../lib/file/tokenizedFile";
import { Intersection } from "../lib/analyze/intersection";
import { Selection } from "../lib/util/selection";
import { SharedKmer } from "../lib/analyze/sharedKmer";
import { Match } from "../lib/analyze/match";

function createFakeFile(name: string): TokenizedFile {
  return new TokenizedFile(
    new File(name, "content"),
    "(program)",
    []
  )
}

function createIntersection(): Intersection {
  const f1 = createFakeFile("file1");
  const f2 = createFakeFile("file2");
  return new Intersection(f1, f2);
}

test("match merging & squashing", t => {
  const int = createIntersection();

  let kmer = new SharedKmer(1, "kmer 1");
  const biggerTopLeft = [];
  // bigger match
  for(let i = 0; i < 10; i++) {
    const match = new Match(
      {
        index: i,
        start: i,
        stop: i + 1,
        location: new Selection(i, 0, i + 1, 0),
        data: "lines 0 - 10",
      },
      {
        index: 20 + i,
        start: 20 + i,
        stop: 20 + i + 1,
        location: new Selection(20 + i, 0, 20 + i + 1, 0),
        data: "lines 20 - 30",
      },
      kmer
    );
    int.addMatch(match)
    t.is(1, int.fragments.length);
    biggerTopLeft.push(match);
  }

  // contained match
  kmer = new SharedKmer(2, "kmer 2");
  const topLeftContained = new Match(
    {
      index: 5,
      start: 5 + 1,
      stop: 5 + 2,
      location: new Selection(5, 0, 6, 0),
      data: "small match line 5",
    },
    {
      index: 25,
      start: 25 + 1,
      stop: 25 + 2,
      location: new Selection(25, 0, 26, 0),
      data: "small match line 25",
    },
    kmer
  );
  int.addMatch(topLeftContained);
  t.is(2, int.fragments.length);

  // bigger match, same location
  const biggerMiddle = [];
  kmer = new SharedKmer(3, "kmer 3");
  for(let i = 0; i < 10; i++) {
    const match = new Match(
      {
        index: 10 + i,
        start: 10 + i + 1,
        stop: 10 + i + 2,
        location: new Selection(10 + i, 0, 10 + i + 1, 0),
        data: "lines 10 - 20",
      },
      {
        index: 20 + i,
        start: 20 + i + 1,
        stop: 20 + i + 2,
        location: new Selection(10 + i, 0, 10 + i + 1, 0),
        data: "lines 10 - 20",
      },
      kmer
    );
    biggerMiddle.push(match);
    int.addMatch(match);
    t.is(3, int.fragments.length);
  }

  // bigger match
  const  biggerBottomLeft = [];
  kmer = new SharedKmer(4, "kmer 4");
  for(let i = 0; i < 10; i++) {
    const match = new Match(
      {
        index: 20 + i,
        start: 20 + i + 1,
        stop: 20 + i + 2,
        location: new Selection(20 + i, 0, 20 + i + 1, 0),
        data: "lines 20 - 30",
      },
      {
        index: i,
        start: i + 1,
        stop: i + 2,
        location: new Selection(i, 0, i + 1, 0),
        data: "lines 0 - 10",
      },
      kmer
    );
    biggerBottomLeft.push(match);
    int.addMatch(match);
    t.is(4, int.fragments.length);
  }

  // contained match
  kmer = new SharedKmer(5, "kmer 5");
  const bottomLeftContained = new Match(
    {
      index: 25,
      start: 25 + 1,
      stop: 25 + 2,
      location: new Selection(25, 0, 26, 0),
      data: "small match line 25",
    },
    {
      index: 5,
      start: 5 + 1,
      stop: 5 + 2,
      location: new Selection(5, 0, 6, 0),
      data: "small match line 5",
    },
    kmer
  );
  int.addMatch(bottomLeftContained);
  t.is(5, int.fragments.length);

  // match not contained
  kmer = new SharedKmer(6, "kmer 6");
  const notContained = new Match(
    {
      index: 5,
      start: 5 + 1,
      stop: 5 + 2,
      location: new Selection(5, 0, 6, 0),
      data: "not contained match line 5",
    },
    {
      index: 5,
      start: 5 + 1,
      stop: 5 + 2,
      location: new Selection(5, 0, 6, 0),
      data: "not contained match line 5",
    },
    kmer
  );
  int.addMatch(notContained);
  t.is(6, int.fragments.length);

  t.deepEqual(biggerTopLeft, int.fragments[0].matches);
  t.deepEqual([topLeftContained], int.fragments[1].matches);
  t.deepEqual([notContained], int.fragments[2].matches);
  t.deepEqual(biggerMiddle, int.fragments[3].matches);
  t.deepEqual(biggerBottomLeft, int.fragments[4].matches);
  t.deepEqual([bottomLeftContained], int.fragments[5].matches);

  int.squash();

  t.is(4, int.fragments.length, "squashed too many");

  t.deepEqual(biggerTopLeft, int.fragments[0].matches)
  t.deepEqual([notContained], int.fragments[1].matches)
  t.deepEqual(biggerMiddle, int.fragments[2].matches)
  t.deepEqual(biggerBottomLeft, int.fragments[3].matches)

});
