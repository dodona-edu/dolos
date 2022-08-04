import test from "ava";
import { File } from "../lib/file/file";
import { TokenizedFile } from "../lib/file/tokenizedFile";
import { Pair } from "../lib/analyze/pair";
import { Region } from "../lib/util/region";
import { SharedFingerprint } from "../lib/analyze/sharedFingerprint";
import { PairedOccurrence } from "../lib/analyze/pairedOccurrence";
import { Dolos } from "../dolos";

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
  /* This test creates the following scenario for the fragments of a pair,
   * where the first column is the kgram index in the left and right files and
   * the other columns show the hash (number) of the fragment matching.
   *
   * idx| Left   | Right
   * ---------------------
   * 0  | 1      | 4
   *    | 1      | 4
   * 5  | 1 2 6  | 4 5 6
   *    | 1      | 4
   * 10 | -      | -
   *    | 3      |
   *    | 3      |
   *    | 3      |
   * 20 | -      | -
   *    | 4      | 1   3
   *    | 4      | 1   3
   * 25 | 4 5    | 1 2 3
   *    | 4      | 1   3
   *    | 4      | 1   3
   * 30 | 4      | 1   3
   *
   * For example: a fragment with hash 1 can be found from index 0 to 10 in the
   * left file, and from index 20 to 30 in the right file, this fragment
   * contains another fragment with hash 2 which can be found on index 5 resp.
   * 25 of the left resp. right file.
   */
  const int = createPair();

  let kgram = new SharedFingerprint(1, "kgram 1".split(" "));
  const biggerTopLeft = [];
  // bigger match (1)
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

  // contained match (2)
  kgram = new SharedFingerprint(2, "kgram 2".split(" "));
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

  // bigger match, same location (3)
  const biggerMiddle = [];
  kgram = new SharedFingerprint(3, "kgram 3".split(" "));
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

  // bigger match (4)
  const  biggerBottomLeft = [];
  kgram = new SharedFingerprint(4, "kgram 4".split(" "));
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

  // contained match (5)
  kgram = new SharedFingerprint(5, "kgram 5".split(" "));
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

  // match not contained (6)
  kgram = new SharedFingerprint(6, "kgram 6".split(" "));
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

  t.deepEqual([1, 6, 3, 4], fragments.map(f => f.pairs[0].fingerprint.hash));

  t.deepEqual(biggerTopLeft, fragments[0].pairs);
  t.deepEqual([notContained], fragments[1].pairs);
  t.deepEqual(biggerMiddle, fragments[2].pairs);
  t.deepEqual(biggerBottomLeft, fragments[3].pairs);
  t.is(4, fragments.length, "squashed too many");
});

test("squash multiple overlapping fragments", t => {
  const int = createPair();

  // outer fragment
  let kgram = new SharedFingerprint(1, "outer match".split(" "));
  const outer = [];
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
    outer.push(pair);
  }

  // middle fragment
  kgram = new SharedFingerprint(2, "middle match".split(" "));
  const middle = [];
  for(let i = 1; i < 9; i++) {
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
    t.is(2, int.fragments().length);
    middle.push(pair);
  }

  // inner fragment
  kgram = new SharedFingerprint(3, "inner match".split(" "));
  const inner = [];
  for(let i = 2; i < 8; i++) {
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
    t.is(3, int.fragments().length);
    inner.push(pair);
  }

  int.squash();
  const fragments = int.fragments();
  t.is(1, fragments.length, "incorrect squash of overlapping fragments");
});

test.failing("repeating sequences should not cause too many fragments", async t => {
  const dolos = new Dolos();

  const report = await dolos.analyze(
    [
      new File("file1", `

  private class ClassWithArray {
      private int padding;
      private char[] chars = {'A','B','C','D','E','F','G','H','I','J','K','L','M',
                            'N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
                            'a','b','c','d','e','f','g','h','i','j','k','l','m',
                            'n','o','p','q','r','s','t','u','v','w','x','y','z'};
      private ClassWithArray() {
        // padding
      };
  }
  `),
      new File("file2", `
      private final class ClassWithMoreArrays {
               private final static char pwdArray [] = {
      \t        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h',
      \t        'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p',
      \t        'q', 'r', 's', 't', 'u', 'v', 'w', 'x',
      \t        'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F',
      \t        'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N',
      \t        'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V',
      \t        'W', 'X', 'Y', 'Z', ' '
        };
      
         private final static char base64Array [] = {
             'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
             'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
             'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
             'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f',
             'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n',
             'o', 'p', 'q', 'r', 's', 't', 'u', 'v',
             'w', 'x', 'y', 'z', '0', '1', '2', '3',
             '4', '5', '6', '7', '8', '9', '+', '/'
        };
      }
      `),
    ]
  );


  t.is(1, report.scoredPairs.length);
  const { pair } = report.scoredPairs[0];

  const fragments = pair.fragments();
  t.is(fragments.length, 2);
});
