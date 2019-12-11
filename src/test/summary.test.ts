import test, { ExecutionContext } from "ava";
import { Comparison, Matches } from "../lib/comparison";
import { Options } from "../lib/options";
import { Range } from "../lib/range";
import { Summary } from "../lib/summary";
import { CodeTokenizer } from "../lib/tokenizers/codeTokenizer";
import { RangesTuple } from "../lib/utils";

/**
 * adapted from https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
 * @param a An array containing the items.
 */

function shuffle<T>(a: T[]) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let seed = 1;
function random(): number {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function containsRangesTuple(
  t: ExecutionContext,
  values: RangesTuple[],
  expected: RangesTuple,
): void {
  t.true(values.some(tup => tup[0].equals(expected[0]) && tup[1].equals(expected[1])));
}

test("simple match to ranges", t => {
  const summary = new Summary(new Map(), new Options());
  const array: Array<[number, number]> = [[1, 5], [2, 6], [3, 7], [4, 8]];
  shuffle(array);

  const rangesTupleArray: RangesTuple[] = summary.matchesToRange(array);
  containsRangesTuple(t, rangesTupleArray, [new Range(1, 4), new Range(5, 8)]);
  t.is(1, rangesTupleArray.length);
});

test("simple match to ranges where second element stays constant", t => {
  const summary = new Summary(new Map(), new Options({minFragmentLength: 0}));
  const array: Array<[number, number]> = [[1, 5], [2, 5], [3, 5], [4, 5]];
  shuffle(array);

  const rangesTupleArray: RangesTuple[] = summary.matchesToRange(array);
  containsRangesTuple(t, rangesTupleArray, [new Range(1, 4), new Range(5, 5)]);
  t.is(1, rangesTupleArray.length);
});

test("simple match to ranges where first element stays constant", t => {
  const summary = new Summary(new Map(), new Options());
  const array: Array<[number, number]> = [[1, 5], [1, 6], [1, 7], [1, 8]];
  shuffle(array);

  const rangesTupleArray: RangesTuple[] = summary.matchesToRange(array);
  containsRangesTuple(t, rangesTupleArray, [new Range(1, 1), new Range(5, 8)]);
  t.is(1, rangesTupleArray.length);
});

test("simple match to ranges where first element stays constant and a gap exists", t => {
  const summary1 = new Summary(new Map(), new Options({maxGapSize: 1}));
  const summary2 = new Summary(new Map(), new Options({maxGapSize: 0}));
  const array: Array<[number, number]> = [[1, 5], [1, 6], [1, 7], [1, 9]];
  shuffle(array);

  const summary2Array = summary2.matchesToRange(array);
  const summary1Array = summary1.matchesToRange(array);
  containsRangesTuple(t, summary1Array, [new Range(1, 1), new Range(5, 9)]);
  t.is(1, summary1Array.length);
  containsRangesTuple(t, summary2Array, [new Range(1, 1), new Range(5, 7)]);
  containsRangesTuple(t, summary2Array, [new Range(1, 1), new Range(9, 9)]);
  t.is(2, summary2Array.length);
});

test("test extending related functions rangesTuples", t => {
  const summary1 = new Summary(new Map(), new Options({maxGapSize: 0}));
  const summary2 = new Summary(new Map(), new Options({maxGapSize: 1}));
  const rangesTuple1: RangesTuple = [new Range(1, 5), new Range(1, 5)];
  const rangesTuple2: RangesTuple = [new Range(6, 10), new Range(6, 20)];
  const rangesTuple3: RangesTuple = [new Range(7, 10), new Range(7, 30)];
  const rangesTuple4: RangesTuple = [new Range(1, 5), new Range(1, 5)];
  const rangesTuple5: RangesTuple = [new Range(12, 200), new Range(21, 5000)];

  t.true(summary1.canExtendRangesTupleWithRangesTuple(rangesTuple1, rangesTuple2));
  t.false(summary1.canExtendRangesTupleWithRangesTuple(rangesTuple1, rangesTuple3));
  t.true(summary2.canExtendRangesTupleWithRangesTuple(rangesTuple1, rangesTuple3));

  summary1.extendRangesTupleWithRangesTuple(rangesTuple1, rangesTuple2);
  t.deepEqual([new Range(1, 10), new Range(1, 20)], rangesTuple1);
  summary2.extendRangesTupleWithRangesTuple(rangesTuple4, rangesTuple3);
  t.deepEqual([new Range(1, 10), new Range(1, 30)], rangesTuple4);
  t.throws(() => summary1.extendRangesTupleWithRangesTuple(rangesTuple1, rangesTuple5), RangeError);
});

test("concatenate ranges", t => {
  const summary = new Summary(new Map(), new Options());
  const rangesTupleArray: RangesTuple[] = [
    [new Range(0, 10), new Range(100, 110)],
    [new Range(10, 30), new Range(110, 120)],
    [new Range(5, 25), new Range(105, 115)],
    [new Range(555, 2001), new Range(0, 33)],
  ];
  const shuffledArray1 = rangesTupleArray.slice();
  const shuffledArray2 = rangesTupleArray.slice();

  shuffle(shuffledArray1);
  shuffle(shuffledArray2); // The second array will have a different order then the first.

  const concatenatedRanges1 = summary.concatenateRanges(shuffledArray1);
  const concatenatedRanges2 = summary.concatenateRanges(shuffledArray2);

  containsRangesTuple(t, concatenatedRanges1, [new Range(0, 30), new Range(100, 120)]);
  containsRangesTuple(t, concatenatedRanges1, rangesTupleArray[3]);

  containsRangesTuple(t, concatenatedRanges2, [new Range(0, 30), new Range(100, 120)]);
  containsRangesTuple(t, concatenatedRanges2, rangesTupleArray[3]);
});

test("integration test", async t => {
  const locations: string[] = [
    "samples/js/sample.js",
    "samples/js/copied_function.js",
    "samples/js/another_copied_function.js",
  ];
  const tokenizer = new CodeTokenizer("javascript");
  const comparison = new Comparison(tokenizer, {
    filterHashByPercentage: true,
    maxHash: 0.8,
  });
  comparison.addFiles(locations);

  const matchesPerFile: Map<string, Matches<number>> = await comparison.compareFiles(locations);

  const summary = new Summary(matchesPerFile, new Options({
    clusterMinMatches: 2,
    maxGapSize: 2,
    minFragmentLength: 4,
  }));

  t.snapshot(summary.toString());
  t.snapshot(summary.toJSON());
});
