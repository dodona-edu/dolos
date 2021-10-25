import test from "ava";
import { File } from "../lib/file/file";
import { TokenizedFile } from "../lib/file/tokenizedFile";
import { Pair } from "../lib/analyze/pair";
import { Region } from "../lib/util/region";
import { SharedWinnowingFingerprint } from "../lib/analyze/winnowing/sharedWinnowingFingerprint";
import { PairedOccurrence } from "../lib/analyze/pairedOccurrence";

function createFakeFile(name: string): TokenizedFile {
  return new TokenizedFile(
    new File(name, "content"),
    ["(", "program", ")"],
    []
  );
}

function createPair(): Pair {
  const f1 = createFakeFile("file1");
  const f2 = createFakeFile("file2");
  return new Pair(f1, f2);
}

test("paired occurrence merging & squashing", t => {
  const int = createPair();

  let kgram = new SharedWinnowingFingerprint(1, "kgram 1".split(" "));
  const biggerTopLeft = [];
  // bigger match
  for(let i = 0; i < 10; i++) {
    const pair = new PairedOccurrence(
      {
        index: i,
        start: i,
        stop: i + 1,
        location: new Region(i, 0, i + 1, 0),
        data: "lines 0 - 10".split(" "),
      },
      {
        index: 20 + i,
        start: 20 + i,
        stop: 20 + i + 1,
        location: new Region(20 + i, 0, 20 + i + 1, 0),
        data: "lines 20 - 30".split(" "),
      },
      kgram
    );
    int.addPair(pair);
    t.is(1, int.fragments().length);
    biggerTopLeft.push(pair);
  }

  // contained match
  kgram = new SharedWinnowingFingerprint(2, "kgram 2".split(" "));
  const topLeftContained = new PairedOccurrence(
    {
      index: 5,
      start: 5 + 1,
      stop: 5 + 2,
      location: new Region(5, 0, 6, 0),
      data: "small match line 5".split(" "),
    },
    {
      index: 25,
      start: 25 + 1,
      stop: 25 + 2,
      location: new Region(25, 0, 26, 0),
      data: "small match line 25".split(" "),
    },
    kgram
  );
  int.addPair(topLeftContained);
  t.is(2, int.fragments().length);

  // bigger match, same location
  const biggerMiddle = [];
  kgram = new SharedWinnowingFingerprint(3, "kgram 3".split(" "));
  for(let i = 0; i < 10; i++) {
    const match = new PairedOccurrence(
      {
        index: 10 + i,
        start: 10 + i + 1,
        stop: 10 + i + 2,
        location: new Region(10 + i, 0, 10 + i + 1, 0),
        data: "lines 10 - 20".split(" "),
      },
      {
        index: 20 + i,
        start: 20 + i + 1,
        stop: 20 + i + 2,
        location: new Region(10 + i, 0, 10 + i + 1, 0),
        data: "lines 10 - 20".split(" "),
      },
      kgram
    );
    biggerMiddle.push(match);
    int.addPair(match);
    t.is(3, int.fragments().length);
  }

  // bigger match
  const  biggerBottomLeft = [];
  kgram = new SharedWinnowingFingerprint(4, "kgram 4".split(" "));
  for(let i = 0; i < 10; i++) {
    const match = new PairedOccurrence(
      {
        index: 20 + i,
        start: 20 + i + 1,
        stop: 20 + i + 2,
        location: new Region(20 + i, 0, 20 + i + 1, 0),
        data: "lines 20 - 30".split(" "),
      },
      {
        index: i,
        start: i + 1,
        stop: i + 2,
        location: new Region(i, 0, i + 1, 0),
        data: "lines 0 - 10".split(" "),
      },
      kgram
    );
    biggerBottomLeft.push(match);
    int.addPair(match);
    t.is(4, int.fragments().length);
  }

  // contained match
  kgram = new SharedWinnowingFingerprint(5, "kgram 5".split(" "));
  const bottomLeftContained = new PairedOccurrence(
    {
      index: 25,
      start: 25 + 1,
      stop: 25 + 2,
      location: new Region(25, 0, 26, 0),
      data: "small match line 25".split(" "),
    },
    {
      index: 5,
      start: 5 + 1,
      stop: 5 + 2,
      location: new Region(5, 0, 6, 0),
      data: "small match line 5".split(" "),
    },
    kgram
  );
  int.addPair(bottomLeftContained);
  t.is(5, int.fragments().length);

  // match not contained
  kgram = new SharedWinnowingFingerprint(6, "kgram 6".split(" "));
  const notContained = new PairedOccurrence(
    {
      index: 5,
      start: 5 + 1,
      stop: 5 + 2,
      location: new Region(5, 0, 6, 0),
      data: "not contained match line 5".split(" "),
    },
    {
      index: 5,
      start: 5 + 1,
      stop: 5 + 2,
      location: new Region(5, 0, 6, 0),
      data: "not contained match line 5".split(" "),
    },
    kgram
  );
  int.addPair(notContained);

  let fragments = int.fragments();
  t.is(6, fragments.length);

  t.deepEqual(biggerTopLeft, fragments[0].pairs);
  t.deepEqual([topLeftContained], fragments[1].pairs);
  t.deepEqual([notContained], fragments[2].pairs);
  t.deepEqual(biggerMiddle, fragments[3].pairs);
  t.deepEqual(biggerBottomLeft, fragments[4].pairs);
  t.deepEqual([bottomLeftContained], fragments[5].pairs);

  int.squash();

  fragments = int.fragments();

  t.is(4, fragments.length, "squashed too many");
  t.deepEqual(biggerTopLeft, fragments[0].pairs);
  t.deepEqual([notContained], fragments[1].pairs);
  t.deepEqual(biggerMiddle, fragments[2].pairs);
  t.deepEqual(biggerBottomLeft, fragments[3].pairs);

});
