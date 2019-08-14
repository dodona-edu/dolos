import { SummaryFilter } from "../summaryFilter";
import { Range } from "./../range";
import { RangesTuple, Summary } from "./../summary";

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

let dummySummaryFilter: SummaryFilter;
beforeAll(() => {
  dummySummaryFilter = new SummaryFilter(0, 1);
});

test("simple match to ranges", () => {
  const summary = new Summary(new Map(), new SummaryFilter(0, 1), 0);
  const array: Array<[number, number]> = [[1, 5], [2, 6], [3, 7], [4, 8]];
  shuffle(array);

  const rangesTupleArray: RangesTuple[] = summary.matchesToRange(array);
  expect(rangesTupleArray).toContainEqual([new Range(1, 4), new Range(5, 8)]);
  expect(rangesTupleArray.length).toBe(1);
});

test("simple match to ranges where second element stays constant", () => {
  const summary = new Summary(new Map(), dummySummaryFilter, 0);
  const array: Array<[number, number]> = [[1, 5], [2, 5], [3, 5], [4, 5]];
  shuffle(array);

  const rangesTupleArray: RangesTuple[] = summary.matchesToRange(array);
  expect(rangesTupleArray).toContainEqual([new Range(1, 4), new Range(5, 5)]);
  expect(rangesTupleArray.length).toBe(1);
});

test("simple match to ranges where first element stays constant", () => {
  const summary = new Summary(new Map(), dummySummaryFilter, 0);
  const array: Array<[number, number]> = [[1, 5], [1, 6], [1, 7], [1, 8]];
  shuffle(array);

  const rangesTupleArray: RangesTuple[] = summary.matchesToRange(array);
  expect(rangesTupleArray).toContainEqual([new Range(1, 1), new Range(5, 8)]);
  expect(rangesTupleArray.length).toBe(1);
});

test("simple match to ranges where first element stays constant and a gap exists", () => {
  const summary1 = new Summary(new Map(), 1, 1, 1);
  const summary2 = new Summary(new Map(), 1, 1, 0);
  const array: Array<[number, number]> = [[1, 5], [1, 6], [1, 7], [1, 9]];
  shuffle(array);

  const summary2Array = summary2.matchesToRange(array);
  expect(summary1.matchesToRange(array)).toContainEqual([new Range(1, 1), new Range(5, 9)]);
  expect(summary2Array).toContainEqual([new Range(1, 1), new Range(5, 7)]);
  expect(summary2Array).toContainEqual([new Range(1, 1), new Range(9, 9)]);
});

test("test extending related functions rangesTuples", () => {
  const summary1 = new Summary(new Map(), 1, 1, 0);
  const summary2 = new Summary(new Map(), 1, 1, 1);
  const rangesTuple1: RangesTuple = [new Range(1, 5), new Range(1, 5)];
  const rangesTuple2: RangesTuple = [new Range(6, 10), new Range(6, 20)];
  const rangesTuple3: RangesTuple = [new Range(7, 10), new Range(7, 30)];
  const rangesTuple4: RangesTuple = [new Range(1, 5), new Range(1, 5)];
  const rangesTuple5: RangesTuple = [new Range(12, 200), new Range(21, 5000)];

  expect(summary1.canExtendRangesTupleWithRangesTuple(rangesTuple1, rangesTuple2)).toBe(true);
  expect(summary1.canExtendRangesTupleWithRangesTuple(rangesTuple1, rangesTuple3)).toBe(false);
  expect(summary2.canExtendRangesTupleWithRangesTuple(rangesTuple1, rangesTuple3)).toBe(true);

  summary1.extendRangesTupleWithRangesTuple(rangesTuple1, rangesTuple2);
  expect(rangesTuple1).toEqual([new Range(1, 10), new Range(1, 20)]);
  summary2.extendRangesTupleWithRangesTuple(rangesTuple4, rangesTuple3);
  expect(rangesTuple4).toEqual([new Range(1, 10), new Range(1, 30)]);
  expect(() => summary1.extendRangesTupleWithRangesTuple(rangesTuple1, rangesTuple5)).toThrowError(
    RangeError,
  );
});
