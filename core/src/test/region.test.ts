import test from "ava";
import { Region } from "../util/region.js";

test("illegal selection", t => {
  t.throws(() => new Region(10, 10, 1, 1));
  t.throws(() => new Region(1, 10, 1, 1));
});

test("overlap multiple rows", t => {
  const a = new Region(1, 5, 2, 5);
  const b = new Region(2, 0, 3, 0);
  const c = new Region(2, 5, 3, 5);
  const d = new Region(3, 0, 4, 0);

  t.true(a.overlapsWith(b));
  t.true(b.overlapsWith(a));

  t.true(b.overlapsWith(c));
  t.true(c.overlapsWith(b));

  t.false(a.overlapsWith(c));
  t.false(c.overlapsWith(a));
  t.false(a.overlapsWith(d));
  t.false(d.overlapsWith(a));
});


test("overlap same row", t => {
  const a = new Region(1, 0, 1, 5);
  const b = new Region(1, 4, 1, 6);
  const c = new Region(1, 5, 1, 10);

  t.true(a.overlapsWith(b));
  t.true(b.overlapsWith(a));

  t.true(b.overlapsWith(c));
  t.true(c.overlapsWith(b));

  t.false(a.overlapsWith(c));
  t.false(c.overlapsWith(a));
});

test("sorting with compare", t => {
  const a = new Region(1, 0, 1, 5);
  const a2 = new Region(1, 0, 1, 5);
  const b = new Region(1, 0, 1, 6);
  const c = new Region(1, 1, 1, 2);
  const d = new Region(2, 3, 4, 5);
  const e = new Region(2, 3, 4, 6);
  const f = new Region(2, 3, 5, 6);

  const unsorted = [f, e, d, c, b, a, a2];
  const sorted = unsorted.sort(Region.compare);

  t.deepEqual(sorted, [a, a2, b, c, d, e, f]);
});

test("merge", t => {
  t.deepEqual(
    Region.merge(new Region(1, 0, 2, 0), new Region(2, 0, 3, 0)),
    new Region(1, 0, 3, 0)
  );
  t.deepEqual(
    Region.merge(new Region(2, 0, 3, 0), new Region(1, 0, 2, 0)),
    new Region(1, 0, 3, 0)
  );
  t.deepEqual(
    Region.merge(new Region(1, 0, 1, 1), new Region(2, 1, 3, 0)),
    new Region(1, 0, 3, 0)
  );
  t.deepEqual(
    Region.merge(new Region(1, 0, 3, 0), new Region(2, 0, 2, 1)),
    new Region(1, 0, 3, 0)
  );
  t.deepEqual(
    Region.merge(new Region(1, 1, 3, 1), new Region(1, 2, 3, 2)),
    new Region(1, 1, 3, 2)
  );
});
