import test from "ava";
import { Dolos } from "../dolos";
import { File } from "../lib/file";
import { Selection } from "../lib/selection";

test("equal content should be a full match", async t => {
  const dolos = new Dolos();
  const content = `

  function hello() {
    return "hello";
  }

  function world() {
    return "world";
  }

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

  console.dir(analysis);
  t.is(analysis.length, 1);
  const intersection = analysis[0];

  t.is(intersection.matches.length, 1);
  const match = intersection.matches[0];

  t.is(match.leftSelection, new Selection(0, 0, 12, 1));
  t.is(match.rightSelection, new Selection(0, 0, 12, 1));
});
