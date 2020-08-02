import test from "ava";
import { Dolos } from "../dolos";
import { File } from "../lib/file/file";
import { Range } from "../lib/util/range";
import { Selection } from "../lib/util/selection";

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

  t.is(1, analysis.scoredIntersections.length);
  const { intersection, similarity } = analysis.scoredIntersections[0];
  t.is(similarity, 1.0);

  const fragments = intersection.fragments();
  t.is(fragments.length, 1);
  const match = fragments[0];

  t.deepEqual(new Selection(2, 2, 11, 2), match.leftSelection);
  t.deepEqual(new Selection(2, 2, 11, 2), match.rightSelection);

  t.deepEqual(new Range(0, 24), match.leftKmers);
  t.deepEqual(new Range(0, 24), match.rightKmers);

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

  t.is(1, analysis.scoredIntersections.length);
  const { intersection, similarity } = analysis.scoredIntersections[0];
  t.is(similarity, 1.0);

  const fragments = intersection.fragments();
  t.is(fragments.length, 1);
  const match = fragments[0];

  t.deepEqual(new Selection(2, 2, 11, 2), match.leftSelection);
  t.deepEqual(new Selection(2, 2, 11, 2), match.rightSelection);

  t.deepEqual(new Range(0, 24), match.leftKmers);
  t.deepEqual(new Range(0, 24), match.rightKmers);
});

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

  t.is(1, analysis.scoredIntersections.length);
  const { intersection, similarity } = analysis.scoredIntersections[0];
  t.is(similarity, 1.0);

  const fragments = intersection.fragments();
  t.is(fragments.length, 1);
  const match = fragments[0];

  t.deepEqual(new Range(0, 24), match.leftKmers);
  t.deepEqual(new Range(0, 24), match.rightKmers);
});

test("changed order should be a good match", async t => {
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

  function helloWorld() {
    console.log(hello() + " " + world())
  }

  function hello() {
    return "hello";
  }

  const world = () => "world";
  `;

  const analysis = await dolos.analyze(
    [
      new File("file1", original),
      new File("file2", changed),
    ]
  );

  t.is(1, analysis.scoredIntersections.length);
  const { intersection, similarity } = analysis.scoredIntersections[0];
  t.true(similarity > 0.75);

  // four fragments: program declaration, hello(), world() and helloWorld()
  t.is(4, intersection.fragments().length);

});
