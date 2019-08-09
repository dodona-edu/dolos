<<<<<<< HEAD
<<<<<<< HEAD
import { Range } from "../range";

test("simple can number extends range test", () => {
  const range = new Range(5, 8);
  expect(range.canExtendWithNumber(-1, 0)).toBe(false);
  expect(range.canExtendWithNumber(0, 0)).toBe(false);
  expect(range.canExtendWithNumber(3, 0)).toBe(false);
  expect(range.canExtendWithNumber(4, 0)).toBe(true);
  expect(range.canExtendWithNumber(5, 0)).toBe(true);
  expect(range.canExtendWithNumber(6, 0)).toBe(true);
  expect(range.canExtendWithNumber(7, 0)).toBe(true);
  expect(range.canExtendWithNumber(8, 0)).toBe(true);
  expect(range.canExtendWithNumber(9, 0)).toBe(true);
  expect(range.canExtendWithNumber(10, 0)).toBe(false);
});

test("simple can number extends range test without gapSize", () => {
  const range = new Range(5, 8);
  expect(range.canExtendWithNumber(-1)).toBe(false);
  expect(range.canExtendWithNumber(0)).toBe(false);
  expect(range.canExtendWithNumber(3)).toBe(false);
  expect(range.canExtendWithNumber(4)).toBe(true);
  expect(range.canExtendWithNumber(5)).toBe(true);
  expect(range.canExtendWithNumber(6)).toBe(true);
  expect(range.canExtendWithNumber(7)).toBe(true);
  expect(range.canExtendWithNumber(8)).toBe(true);
  expect(range.canExtendWithNumber(9)).toBe(true);
  expect(range.canExtendWithNumber(10)).toBe(false);
});

test("can number extend range with gap size", () => {
  const range = new Range(5, 8);

  for (const i of Array(10).keys()) {
    expect(range.canExtendWithNumber(3 - i, i)).toBe(false);
    expect(range.canExtendWithNumber(4 - i, i)).toBe(true);
    expect(range.canExtendWithNumber(5 - i, i)).toBe(true);
    expect(range.canExtendWithNumber(6 - i, i)).toBe(true);
    expect(range.canExtendWithNumber(6 + i, i)).toBe(true);
    expect(range.canExtendWithNumber(7 + i, i)).toBe(true);
    expect(range.canExtendWithNumber(8 + i, i)).toBe(true);
    expect(range.canExtendWithNumber(9 + i, i)).toBe(true);
    expect(range.canExtendWithNumber(10 + i, i)).toBe(false);
  }
});

test("simple can range extend other range", () => {
  const range = new Range(5, 10);

  expect(range.canExtendWithRange(new Range(0, 3), 0)).toBe(false);
  expect(range.canExtendWithRange(new Range(0, 4), 0)).toBe(true);
  expect(range.canExtendWithRange(new Range(0, 5), 0)).toBe(true);
  expect(range.canExtendWithRange(new Range(0, 6), 0)).toBe(true);
  expect(range.canExtendWithRange(new Range(0, 7), 0)).toBe(true);
  expect(range.canExtendWithRange(new Range(0, 9), 0)).toBe(true);
  expect(range.canExtendWithRange(new Range(0, 10), 0)).toBe(true);
  expect(range.canExtendWithRange(new Range(0, 11), 0)).toBe(true);
  expect(range.canExtendWithRange(new Range(0, 12), 0)).toBe(true);

  expect(range.canExtendWithRange(new Range(12, 20), 0)).toBe(false);
  expect(range.canExtendWithRange(new Range(11, 20), 0)).toBe(true);
  expect(range.canExtendWithRange(new Range(10, 20), 0)).toBe(true);
  expect(range.canExtendWithRange(new Range(9, 20), 0)).toBe(true);
  expect(range.canExtendWithRange(new Range(7, 20), 0)).toBe(true);
  expect(range.canExtendWithRange(new Range(4, 20), 0)).toBe(true);

  expect(range.canExtendWithRange(new Range(7, 7), 0)).toBe(true);
});

test("can range extend other range with gap size", () => {
  const range = new Range(5, 10);

  for (const i of Array(4).keys()) {
    expect(range.canExtendWithRange(new Range(0, 3 - i), i)).toBe(false);
    expect(range.canExtendWithRange(new Range(0, 4 - i), i)).toBe(true);
    expect(range.canExtendWithRange(new Range(0, 5 - i), i)).toBe(true);
    expect(range.canExtendWithRange(new Range(0, 6 - i), i)).toBe(true);
    expect(range.canExtendWithRange(new Range(0, 7 - i), i)).toBe(true);
    expect(range.canExtendWithRange(new Range(0, 9 + i), i)).toBe(true);
    expect(range.canExtendWithRange(new Range(0, 10 + i), i)).toBe(true);
    expect(range.canExtendWithRange(new Range(0, 11 + i), i)).toBe(true);
    expect(range.canExtendWithRange(new Range(0, 12 + i), i)).toBe(true);

    expect(range.canExtendWithRange(new Range(12 + i, 20), i)).toBe(false);
    expect(range.canExtendWithRange(new Range(11 + i, 20), i)).toBe(true);
    expect(range.canExtendWithRange(new Range(7 - i, 20), i)).toBe(true);
    expect(range.canExtendWithRange(new Range(4 - i, 20), i)).toBe(true);
  }
});

test("lowerbound higher then upperbound", () => {
  expect(() => new Range(4, 2)).toThrowError(RangeError);
});

test("test number extend range", () => {
  const range = new Range(4, 6);
  expect(range.extendWithNumber(3).areEqual(3, 6)).toBe(true);
  expect(range.extendWithNumber(-10).areEqual(-10, 6)).toBe(true);
  expect(range.extendWithNumber(5).areEqual(-10, 6)).toBe(true);
  expect(range.extendWithNumber(20).areEqual(-10, 20)).toBe(true);
});

test("test range extend range", () => {
  expect(new Range(0, 5).extendWithRange(new Range(3, 3)).areEqual(0, 5)).toBe(true);
  expect(new Range(0, 5).extendWithRange(new Range(-10, 10)).areEqual(-10, 10)).toBe(true);
  expect(new Range(0, 5).extendWithRange(new Range(3, 10)).areEqual(0, 10)).toBe(true);
  expect(new Range(0, 5).extendWithRange(new Range(-10, 5)).areEqual(-10, 5)).toBe(true);
});

test("lines in range", () => {
  const range = new Range(100, 200);
  expect(range.getLineCount()).toBe(101);

  const negativeBoundRange = new Range(-500, -100);
  expect(negativeBoundRange.getLineCount()).toBe(401);
});
=======
import { Range } from '../range';
=======
import { Range } from "../range";
>>>>>>> 612e7a9... applied formatting

test("simple can number extends range test", () => {
  const range = new Range(5, 8);
  expect(range.canExtendWithNumber(3, 0)).toBeFalsy();
  expect(range.canExtendWithNumber(4, 0)).toBeTruthy();
  expect(range.canExtendWithNumber(6, 0)).toBeTruthy();
  expect(range.canExtendWithNumber(6, 0)).toBeTruthy();
  expect(range.canExtendWithNumber(9, 0)).toBeTruthy();
  expect(range.canExtendWithNumber(10, 0)).toBeFalsy();
});

test("can number extend range with gap size", () => {
  const range = new Range(5, 8);

  for (const i of Array(10).keys()) {
    expect(range.canExtendWithNumber(3 - i, i)).toBeFalsy();
    expect(range.canExtendWithNumber(4 - i, i)).toBeTruthy();
    expect(range.canExtendWithNumber(6 - i, i)).toBeTruthy();
    expect(range.canExtendWithNumber(6 + i, i)).toBeTruthy();
    expect(range.canExtendWithNumber(9 + i, i)).toBeTruthy();
    expect(range.canExtendWithNumber(10 + i, i)).toBeFalsy();
  }
});

test("simple can range extend other range", () => {
  const range = new Range(5, 10);

  expect(range.canExtendWithRange(new Range(0, 3), 0)).toBeFalsy();
  expect(range.canExtendWithRange(new Range(0, 4), 0)).toBeTruthy();
  expect(range.canExtendWithRange(new Range(0, 7), 0)).toBeTruthy();
  expect(range.canExtendWithRange(new Range(0, 11), 0)).toBeTruthy();
  expect(range.canExtendWithRange(new Range(0, 12), 0)).toBeTruthy();

  expect(range.canExtendWithRange(new Range(12, 20), 0)).toBeFalsy();
  expect(range.canExtendWithRange(new Range(11, 20), 0)).toBeTruthy();
  expect(range.canExtendWithRange(new Range(7, 20), 0)).toBeTruthy();
  expect(range.canExtendWithRange(new Range(4, 20), 0)).toBeTruthy();

  expect(range.canExtendWithRange(new Range(7, 7), 0)).toBeTruthy();
});

test("can range extend other range with gap size", () => {
  const range = new Range(5, 10);

  for (const i of Array(4).keys()) {
    expect(range.canExtendWithRange(new Range(0, 3 - i), i)).toBeFalsy();
    expect(range.canExtendWithRange(new Range(0, 4 - i), i)).toBeTruthy();
    expect(range.canExtendWithRange(new Range(0, 7 - i), i)).toBeTruthy();
    expect(range.canExtendWithRange(new Range(0, 11 + i), i)).toBeTruthy();
    expect(range.canExtendWithRange(new Range(0, 12 + i), i)).toBeTruthy();

    expect(range.canExtendWithRange(new Range(12 + i, 20), i)).toBeFalsy();
    expect(range.canExtendWithRange(new Range(11 + i, 20), i)).toBeTruthy();
    expect(range.canExtendWithRange(new Range(7 - i, 20), i)).toBeTruthy();
    expect(range.canExtendWithRange(new Range(4 - i, 20), i)).toBeTruthy();
  }
});

test("lowerbound higher then upperbound", () => {
  expect(() => new Range(4, 2)).toThrowError(RangeError);
});

test("test number extend range", () => {
  const range = new Range(4, 6);
  expect(range.extendWithNumber(3).areEqual(3, 6)).toBeTruthy();
  expect(range.extendWithNumber(-10).areEqual(-10, 6)).toBeTruthy();
  expect(range.extendWithNumber(5).areEqual(-10, 6)).toBeTruthy();
  expect(range.extendWithNumber(20).areEqual(-10, 20)).toBeTruthy();
});

test("test range extend range", () => {
<<<<<<< HEAD
    
    expect(new Range(0, 5).extendWithRange(new Range(3, 3)).areEqual(0, 5)).toBeTruthy();
    expect(new Range(0, 5).extendWithRange(new Range(-10, 10)).areEqual(-10, 10)).toBeTruthy();
    expect(new Range(0, 5).extendWithRange(new Range(3, 10)).areEqual(0, 10)).toBeTruthy();
    expect(new Range(0, 5).extendWithRange(new Range(-10, 5)).areEqual(-10, 5)).toBeTruthy();
});
>>>>>>> 718df5a... added tests
=======
  expect(new Range(0, 5).extendWithRange(new Range(3, 3)).areEqual(0, 5)).toBeTruthy();
  expect(new Range(0, 5).extendWithRange(new Range(-10, 10)).areEqual(-10, 10)).toBeTruthy();
  expect(new Range(0, 5).extendWithRange(new Range(3, 10)).areEqual(0, 10)).toBeTruthy();
  expect(new Range(0, 5).extendWithRange(new Range(-10, 5)).areEqual(-10, 5)).toBeTruthy();
});
>>>>>>> 612e7a9... applied formatting
