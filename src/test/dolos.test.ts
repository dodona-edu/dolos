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

  t.is(analysis.length, 1);
  const intersection = analysis[0];

  t.is(intersection.matches.length, 1);
  const match = intersection.matches[0];

  t.deepEqual(match.leftSelection, new Selection(2, 2, 11, 2));
  t.deepEqual(match.rightSelection, new Selection(2, 2, 11, 2));

  t.deepEqual(match.leftKmers, new Range(0, 24));
  t.deepEqual(match.rightKmers, new Range(0, 24));

});
