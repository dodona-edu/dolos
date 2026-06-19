import { describe, it, expect } from "vitest";
import {
  chainSort,
  booleanSort,
  reverseSort,
  timestampSort,
} from "./SortingFunctions";

describe("chainSort", () => {
  it("returns 0 when no sorters are given", () => {
    expect(chainSort<number>()(1, 2)).toBe(0);
  });

  it("falls through to the next sorter on ties", () => {
    const byTie = () => 0;
    const byValue = (a: number, b: number) => a - b;
    const sort = chainSort(byTie, byValue);
    expect(sort(1, 5)).toBeLessThan(0);
    expect(sort(5, 1)).toBeGreaterThan(0);
  });

  it("uses the first decisive sorter", () => {
    const decisive = () => -1;
    const never = () => 1;
    expect(chainSort(decisive, never)(1, 2)).toBe(-1);
  });
});

describe("booleanSort", () => {
  const truthy = booleanSort<number>((n) => n > 0);

  it("ranks non-matching before matching", () => {
    // predicate true sorts after (positive), false sorts before
    expect(truthy(5, -5)).toBe(1);
    expect(truthy(-5, 5)).toBe(-1);
  });

  it("treats equal predicate results as ties", () => {
    expect(truthy(5, 5)).toBe(0);
    expect(truthy(-1, -2)).toBe(0);
  });
});

describe("reverseSort", () => {
  it("negates the wrapped sorter", () => {
    const asc = (a: number, b: number) => a - b;
    const desc = reverseSort(asc);
    expect(desc(1, 5)).toBe(4);
    expect(desc(5, 1)).toBe(-4);
  });
});

describe("timestampSort", () => {
  const sort = timestampSort<{ t: Date }>((x) => x.t);

  it("orders earlier dates before later ones", () => {
    const early = { t: new Date("2020-01-01") };
    const late = { t: new Date("2021-01-01") };
    expect(sort(early, late)).toBe(-1);
    expect(sort(late, early)).toBe(1);
  });
});
