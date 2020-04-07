import test from "ava";
import { Dolos } from "../dolos";
import { File } from "../lib/file";
import { Range } from "../lib/range";
import { Selection } from "../lib/selection";

test("equal content should be a full match", async t => {
  const dolos = new Dolos();
  const content = `

  function hello() {
    return "hello";
  }

  const world = () => "world";

  function helloWorld() {
    console.log(hello() + " " + world())
  }
  `;

  const analysis = await dolos.analyze(
    [
      new File("file1", content),
      new File("file2", content),
    ]
  );

  t.is(analysis.intersections().length, 1);
  const { intersection, similarity } = analysis.scoredIntersections()[0];
  t.is(similarity, 1.0);

  t.is(intersection.matches.length, 1);
  const match = intersection.matches[0];

  t.deepEqual(match.leftSelection, new Selection(2, 2, 11, 2));
  t.deepEqual(match.rightSelection, new Selection(2, 2, 11, 2));

  t.deepEqual(match.leftKmers, new Range(0, 24));
  t.deepEqual(match.rightKmers, new Range(0, 24));

});

test("renamed variables should be a full match", async t => {
  const dolos = new Dolos();
  const original = `

  function hello() {
    return "hello";
  }

  const world = () => "world";

  function helloWorld() {
    console.log(hello() + " " + world())
  }
  `;

  const changed = `

  function hallo() {
    return "hallo";
  }

  const wereld = () => "wereld";

  function halloWereld() {
    console.log(halo() + " " + wereld())
  }
  `;

  const analysis = await dolos.analyze(
    [
      new File("file1", original),
      new File("file2", changed),
    ]
  );

  t.is(analysis.intersections().length, 1);
  const { intersection, similarity } = analysis.scoredIntersections()[0];
  t.is(similarity, 1.0);

  t.is(intersection.matches.length, 1);
  const match = intersection.matches[0];

  t.deepEqual(match.leftSelection, new Selection(2, 2, 11, 2));
  t.deepEqual(match.rightSelection, new Selection(2, 2, 11, 2));

  t.deepEqual(match.leftKmers, new Range(0, 24));
  t.deepEqual(match.rightKmers, new Range(0, 24));
})

test("changed whitespace and semicolons should be a full match", async t => {
  const dolos = new Dolos();
  const original = `

  function hello() {
    return "hello";
  }

  const world = () => "world";

  function helloWorld() {
    console.log(hello() + " " + world())
  }
  `;

  const changed = `
  function hello() {

    return "hello"

  }
  const world =
    () => "world";
  function helloWorld() {
    console.log(
      hello() +
      " " + world()
    );
  }
  `;

  const analysis = await dolos.analyze(
    [
      new File("file1", original),
      new File("file2", changed),
    ]
  );

  t.is(analysis.intersections().length, 1);
  const { intersection, similarity } = analysis.scoredIntersections()[0];
  t.is(similarity, 1.0);

  t.is(intersection.matches.length, 1);
  const match = intersection.matches[0];

  t.deepEqual(match.leftKmers, new Range(0, 24));
  t.deepEqual(match.rightKmers, new Range(0, 24));
})
