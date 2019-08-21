import { RangesTuple } from "../summary";
import { Matches } from "./../comparison";
import { Range } from "./../range";
import { SummaryFilter } from "./../summaryFilter";

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

test("filter by maximum passage percentage", () => {
  const filter: SummaryFilter = new SummaryFilter(0, 0, 0.5, 3);
  const dummyResults: Map<string, Matches<Range>> = new Map([
    [
      "dummyFile1",
      new Map([
        ["dummyFile2", [[new Range(4, 9), new Range(5, 10)], [new Range(3, 7), new Range(6, 11)]]],
        ["dummyFile3", [[new Range(3, 31), new Range(6, 62)], [new Range(6, 20), new Range(5, 7)]]],
      ]),
    ],
    ["dummyFile3", new Map([["dummyFile2", [[new Range(11, 30), new Range(5, 10)]]]])],
  ]);

  const filteredDummyResults = filter.filterByMaximumPassagePercentage(dummyResults);
  expect(filteredDummyResults.has("dummyFile1"));
  const dummyMatches: Matches<Range> = filteredDummyResults.get("dummyFile1") as Matches<Range>;
  expect(dummyMatches.has("dummyFile2")).toBe(true);

  let dummyLines: Array<[Range, Range]> = dummyMatches.get("dummyFile2") as Array<[Range, Range]>;
  expect(dummyLines).toContainEqual([new Range(3, 7), new Range(6, 11)]);
  expect(dummyLines).not.toContainEqual([new Range(4, 9), new Range(5, 10)]);

  expect(dummyMatches.has("dummyFile3")).toBe(true);
  dummyLines = dummyMatches.get("dummyFile3") as Array<[Range, Range]>;
  expect(dummyLines.length).toBe(2);

  expect(filteredDummyResults.has("dummyFile3")).toBe(false);
});

test("filter by maximum passage count", () => {
  const filter: SummaryFilter = new SummaryFilter(0, 0, 1, undefined);

  const dummyResults: Map<string, Matches<Range>> = new Map([
    [
      "dummyFile1",
      new Map([
        ["dummyFile2", [[new Range(4, 9), new Range(5, 10)], [new Range(3, 7), new Range(6, 11)]]],
        ["dummyFile3", [[new Range(3, 31), new Range(6, 62)], [new Range(6, 20), new Range(5, 7)]]],
      ]),
    ],
    ["dummyFile3", new Map([["dummyFile2", [[new Range(11, 30), new Range(5, 10)]]]])],
  ]);

  const filteredDummyResults = filter.filterByMaximumPassageCount(dummyResults);
  expect(filteredDummyResults.has("dummyFile1"));
  const dummyMatches: Matches<Range> = filteredDummyResults.get("dummyFile1") as Matches<Range>;
  expect(dummyMatches.has("dummyFile2")).toBe(true);

  let dummyLines: Array<[Range, Range]> = dummyMatches.get("dummyFile2") as Array<[Range, Range]>;
  expect(dummyLines).toContainEqual([new Range(3, 7), new Range(6, 11)]);
  expect(dummyLines).not.toContainEqual([new Range(4, 9), new Range(5, 10)]);

  expect(dummyMatches.has("dummyFile3")).toBe(true);
  dummyLines = dummyMatches.get("dummyFile3") as Array<[Range, Range]>;
  expect(dummyLines.length).toBe(2);

  expect(filteredDummyResults.has("dummyFile3")).toBe(false);
});

test("prune test", () => {
  const dummyMap: Map<string, Matches<number>> = new Map([
    ["dummyFile1", new Map([["dummyFile2", [[1, 3]]], ["dummyFile3", []]])],
    ["dummyFile2", new Map([["dummyFile3", []]])],
  ]);

  const filteredMap: Map<string, Matches<number>> = SummaryFilter.prune(dummyMap);

  expect(filteredMap.has("dummyFile1")).toBe(true);
  const subMap: Matches<number> = filteredMap.get("dummyFile1") as Matches<number>;
  expect(subMap.has("dummyFile2")).toBe(true);
  expect(subMap.has("dummyFile3")).toBe(false);

  expect(filteredMap.has("dummyFile2")).toBe(false);
});
