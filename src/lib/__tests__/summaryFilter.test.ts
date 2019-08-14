import { RangesTuple } from "../summary";
import { Matches } from "./../comparison";
import { Range } from "./../range";
import { SummaryFilter } from "./../summaryFilter";

test("simple contains test", () => {
  const array: Array<[number, number]> = [[1, 3], [1, 5], [1, 3], [1, 4], [1, 6], [1, 4]];
  expect(SummaryFilter.contains(array, [1, 3])).toBe(true);
  expect(SummaryFilter.contains(array, [1, 4])).toBe(true);
  expect(SummaryFilter.contains(array, [1, 5])).toBe(true);
  expect(SummaryFilter.contains(array, [1, 6])).toBe(true);
  expect(SummaryFilter.contains(array, [1, 7])).toBe(false);
});

test("simple unique test", () => {
  const array: Array<[number, number]> = [[1, 3], [1, 5], [1, 3], [1, 4], [1, 6], [1, 4]];

  const uniqueArray = SummaryFilter.unique(array);
  expect(uniqueArray.length).toBe(4);
  expect(uniqueArray.filter(item => item[0] === 1 && item[1] === 3).length).toBe(1);
  expect(uniqueArray.filter(item => item[0] === 1 && item[1] === 4).length).toBe(1);
});

test("filter rangesTuple by minimum lines", () => {
  const summaryFilter = new SummaryFilter(3, 2);
  const rangesTupleArray: RangesTuple[] = [
    [new Range(1, 1), new Range(2, 2)],
    [new Range(1, 1000), new Range(8002, 9001)],
    [new Range(1, 2), new Range(1, 2)],
    [new Range(1, 1), new Range(1, 5)],
    [new Range(1, 2), new Range(1, 3)],
  ];

  const summaryArray = summaryFilter.filterByMinimumLines(rangesTupleArray);

  expect(summaryArray).not.toContainEqual(rangesTupleArray[0]);
  expect(summaryArray).toContainEqual(rangesTupleArray[1]);
  expect(summaryArray).not.toContainEqual(rangesTupleArray[2]);
  expect(summaryArray).not.toContainEqual(rangesTupleArray[3]);
  expect(summaryArray).toContainEqual(rangesTupleArray[4]);
  expect(summaryArray.length).toBe(2);
});

test("filter by base file test", () => {
  const baseFileMatching1: Array<[number, number]> = [[20, 9001], [25, 9006], [30, 9011]];

  const baseFileMatching2: Array<[number, number]> = [[430, 2000], [450, 2001]];

  const matchingLinesArray: Array<[number, number]> = [
    [1, 40],
    [20, 400],
    [21, 430],
    [21, 430],
    [21, 430],
    [20, 400],
    [20, 400],
    [20, 400],
    [24, 450],
    [20, 400],
    [20, 400],
    [25, 500],
    [30, 600],
    [31, 45],
  ];

  const filteredMatchingLinesArray = SummaryFilter.filterByBaseFile(
    matchingLinesArray,
    baseFileMatching1,
    baseFileMatching2,
  );
  expect(filteredMatchingLinesArray.length).toBe(2);
  expect(filteredMatchingLinesArray).toContainEqual(matchingLinesArray[0]);
  expect(filteredMatchingLinesArray).toContainEqual(
    matchingLinesArray[matchingLinesArray.length - 1],
  );
});

test("filter by base file map", () => {
  const dummyResults: Map<string, Matches<number>> = new Map([
    [
      "dummyFile1",
      new Map([["dummyFile2", [[4, 9], [5, 10], [6, 30]]], ["dummyFile3", [[30, 31], [6, 20]]]]),
    ],
    ["dummyFile3", new Map([["dummyFile2", [[5, 10]]]])],
  ]);

  const dummyBaseFileMatching: Map<string, Matches<number>> = new Map([
    ["dummyFile1", new Map([["sourceFile1", [[4, 2000]]], ["sourceFile2", [[5, 9001]]]])],
    ["dummyFile2", new Map([["sourceFile1", [[10, 7999]]]])],
  ]);

  const summaryFilter = new SummaryFilter(0, 0, 0, dummyBaseFileMatching);
  const filteredDummyResults: Map<string, Matches<number>> = summaryFilter.filterByBaseFile(
    dummyResults,
  );

  expect(filteredDummyResults.has("dummyFile2")).toBe(false);
  expect(filteredDummyResults.has("dummyFile1")).toBe(true);
  const matches = filteredDummyResults.get("dummyFile1") as Matches<number>;
  expect(matches.has("dummyFile2")).toBe(true);

  let matchedLines: Array<[number, number]> = matches.get("dummyFile2") as Array<[number, number]>;
  expect(matchedLines.length).toBe(1);
  expect(matchedLines).toContainEqual([6, 30]);

  expect(matches.has("dummyFile3")).toBe(true);
  matchedLines = matches.get("dummyFile3") as Array<[number, number]>;

  expect(matchedLines.length).toBe(2);
});

test("filter by maximum passage percentage", () => {
  const filter: SummaryFilter = new SummaryFilter(0, 0, 0.5, undefined, 3);
  const dummyResults: Map<string, Matches<number>> = new Map([
    [
      "dummyFile1",
      new Map([["dummyFile2", [[4, 9], [5, 10]]], ["dummyFile3", [[30, 31], [6, 20]]]]),
    ],
    ["dummyFile3", new Map([["dummyFile2", [[5, 10]]]])],
  ]);

  const filteredDummyResults = filter.filterByMaximumPassagePercentage(dummyResults);
  expect(filteredDummyResults.has("dummyFile1"));
  const dummyMatches: Matches<number> = filteredDummyResults.get("dummyFile1") as Matches<number>;
  expect(dummyMatches.has("dummyFile2")).toBe(true);

  let dummyLines: Array<[number, number]> = dummyMatches.get("dummyFile2") as Array<[number, number]>;
  expect(dummyLines).toContainEqual([4, 9]);
  expect(dummyLines).not.toContainEqual([5, 10]);

  expect(dummyMatches.has("dummyFile3")).toBe(true);
  dummyLines = dummyMatches.get("dummyFile3") as Array<[number, number]>;
  expect(dummyLines.length).toBe(2);

  expect(filteredDummyResults.has("dummyFile3")).toBe(false);
});

test("prune test", () => {
  const dummyMap: Map<string, Matches<number>> = new Map([
    ['dummyFile1', new Map([
      ['dummyFile2', [[1, 3]]],
      ['dummyFile3', []]
    ])] ,
    ['dummyFile2', new Map([
      ['dummyFile3', []]
    ])]
  ]);

  const filteredMap: Map<string, Matches<number>> = SummaryFilter.prune(dummyMap);


  expect(filteredMap.has('dummyFile1')).toBe(true);
  const subMap: Matches<number> = filteredMap.get('dummyFile1') as Matches<number>;
  expect(subMap.has('dummyFile2')).toBe(true);
  expect(subMap.has('dummyFile3')).toBe(false);

  expect(filteredMap.has('dummyFile2')).toBe(false);
});
