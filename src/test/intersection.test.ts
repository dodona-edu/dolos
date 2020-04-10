import test from "ava";
import { File } from "../lib/file/file";
import { TokenizedFile } from "../lib/file/tokenizedFile";
import { Intersection } from "../lib/analyze/intersection";
import { Selection } from "../lib/util/selection";
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

  const biggerTopLeft = [];
  // bigger match
  for(let i = 0; i < 10; i++) {
    const match = new Match(
      i,
      new Selection(i, 0, i + 1, 0),
      "lines 0 - 10",
      20 + i,
      new Selection(20 + i, 0, 20 + i + 1, 0),
      "lines 20 - 30",
      i
    );
    int.addMatch(match)
    biggerTopLeft.push(match);
  }

  // contained match
  const topLeftContained = new Match(
    5,
    new Selection(5, 0, 6, 0),
    "small match line 5",
    25,
    new Selection(25, 0, 26, 0),
    "small match line 25",
    1337
  );
  int.addMatch(topLeftContained);

  // bigger match, same location
  const biggerMiddle = [];
  for(let i = 0; i < 10; i++) {
    const match = new Match(
      10 + i,
      new Selection(10 + i, 0, 10 + i + 1, 0),
      "lines 10 - 20",
      20 + i,
      new Selection(10 + i, 0, 10 + i + 1, 0),
      "lines 10 - 20",
      10 + i
    );
    biggerMiddle.push(match);
    int.addMatch(match);
  }

  // bigger match
  const  biggerBottomLeft = [];
  for(let i = 0; i < 10; i++) {
    const match = new Match(
      20 + i,
      new Selection(20 + i, 0, 20 + i + 1, 0),
      "lines 20 - 30",
      i,
      new Selection(i, 0, i + 1, 0),
      "lines 0 - 10",
      20 + i
    );
    biggerBottomLeft.push(match);
    int.addMatch(match);
  }

  // contained match
  const bottomLeftContained = new Match(
    25,
    new Selection(25, 0, 26, 0),
    "small match line 25",
    5,
    new Selection(5, 0, 6, 0),
    "small match line 5",
    42
  );
  int.addMatch(bottomLeftContained);

  // match not contained
  const notContained = new Match(
    5,
    new Selection(5, 0, 6, 0),
    "not contained match line 5",
    5,
    new Selection(5, 0, 6, 0),
    "not contained match line 5",
    666
  );
  int.addMatch(notContained);


  t.is(6, int.fragments.length);
  t.deepEqual(biggerTopLeft, int.fragments[0].matches)
  t.deepEqual([topLeftContained], int.fragments[1].matches)
  t.deepEqual(biggerMiddle, int.fragments[2].matches)
  t.deepEqual(biggerBottomLeft, int.fragments[3].matches)
  t.deepEqual([bottomLeftContained], int.fragments[4].matches)
  t.deepEqual([notContained], int.fragments[5].matches)

  int.squash();

  t.is(4, int.fragments.length);
  t.deepEqual(biggerTopLeft, int.fragments[0].matches)
  t.deepEqual([notContained], int.fragments[1].matches)
  t.deepEqual(biggerMiddle, int.fragments[2].matches)
  t.deepEqual(biggerBottomLeft, int.fragments[3].matches)

});
