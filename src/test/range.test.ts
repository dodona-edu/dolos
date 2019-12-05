import test from "ava";
import { Range } from "../lib/range";

test("invalid range", t => {
  t.throws(() => new Range(1337, 42), RangeError);
});

test("canExtend with number", t => {
  const range = new Range(2, 4);

  t.true(range.canExtendWithNumber(3));

  t.true(range.canExtendWithNumber(1));
  t.true(range.canExtendWithNumber(5));

  t.false(range.canExtendWithNumber(0));
  t.false(range.canExtendWithNumber(6));

  t.true(range.canExtendWithNumber(0, 1));
  t.true(range.canExtendWithNumber(6, 1));

  t.false(range.canExtendWithNumber(-1, 1));
  t.false(range.canExtendWithNumber(7, 1));

});

test("canExtend with range", t => {
  const range = new Range(2, 4);

  t.true(range.canExtendWithRange(new Range(2, 3)));

  t.true(range.canExtendWithRange(new Range(0, 1)));
  t.true(range.canExtendWithRange(new Range(5, 10)));

  t.false(range.canExtendWithRange(new Range(6, 10)));
  t.true(range.canExtendWithRange(new Range(6, 10), 1));
});

test("extend with number", t => {
  const range = new Range(2, 4).extendWithNumber(2);
  t.true(range.from === 2 && range.to === 4);

  range.extendWithNumber(5);
  t.true(range.from === 2 && range.to === 5);

  range.extendWithNumber(0);
  t.true(range.from === 0 && range.to === 5);
});

test("extend with range", t => {
  const range = new Range(2, 4).extendWithRange(new Range(2, 3));
  t.true(range.from === 2 && range.to === 4);

  range.extendWithRange(new Range(1, 6));
  t.true(range.from === 1 && range.to === 6);

  range.extendWithRange(new Range(7, 8));
  t.true(range.from === 1 && range.to === 8);

  range.extendWithRange(new Range(-2, 1));
  t.true(range.from === -2 && range.to === 8);
});
