import test from "ava";
import { Range } from "../util/range.js";

test("illegal range", t => {
  t.throws(() => new Range(1337, 42));
  t.throws(() => new Range(69, 69));
});

test("range length", t => {
  t.is(1, new Range(10).length);
  t.is(2, new Range(10, 12).length);
  t.is(100, new Range(0, 100).length);
});

test("range overlap", t => {
  t.is(true, new Range(1, 5).overlapsWith(new Range(3, 4)));
  t.is(true, new Range(1, 4).overlapsWith(new Range(3, 4)));
  t.is(true, new Range(3, 5).overlapsWith(new Range(1, 5)));
  t.is(true, new Range(3, 5).overlapsWith(new Range(1, 4)));
  t.is(true, new Range(1).overlapsWith(new Range(1)));

  t.is(false, new Range(1, 2).overlapsWith(new Range(3, 4)));
  t.is(false, new Range(1, 3).overlapsWith(new Range(3, 4)));
  t.is(false, new Range(3, 5).overlapsWith(new Range(1, 3)));
  t.is(false, new Range(4, 5).overlapsWith(new Range(1, 3)));
});

test("range merge", t => {
  t.deepEqual(new Range(1, 5), Range.merge(new Range(1, 2), new Range(3, 5)));
  t.deepEqual(new Range(1, 5), Range.merge(new Range(3, 5), new Range(1, 2)));
  t.deepEqual(new Range(1, 5), Range.merge(new Range(1, 4), new Range(2, 5)));
  t.deepEqual(new Range(1, 5), Range.merge(new Range(4, 5), new Range(1, 2)));
  t.deepEqual(new Range(1, 2), Range.merge(new Range(1, 2), new Range(1, 2)));
});

test("total cover", t => {
  t.is(1, Range.totalCovered([new Range(1)]));
  t.is(3, Range.totalCovered([new Range(1, 4)]));
  t.is(3, Range.totalCovered([new Range(1, 4), new Range(1, 4)]));
  t.is(3, Range.totalCovered([new Range(1, 4), new Range(2, 3)]));
  t.is(3, Range.totalCovered([new Range(1, 3), new Range(3, 4)]));
  t.is(2, Range.totalCovered([new Range(1), new Range(4)]));
  t.is(
    7,
    Range.totalCovered([
      new Range(1, 3),
      new Range(2, 5),
      new Range(3, 4),
      new Range(7, 10),
    ])
  );
});

test("compare", t => {
  const a1 = new Range(1);
  const a2 = new Range(1, 2);
  const b = new Range(3, 5);
  const c = new Range(3, 6);
  const d = new Range(4);

  t.deepEqual(
    [a1, a2, b, c, d],
    [d, c, b, a1, a2].sort(Range.compare)
  );
});
