import test from "ava";
import { Dolos } from "../dolos";
import { File } from "../lib/file/file";
import { Region } from "../lib/util/region";

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

  const report = await dolos.analyze(
    [
      new File("file1.js", content),
      new File("file2.js", content),
    ]
  );

  t.is(1, report.scoredPairs.length);
  const { pair, similarity } = report.scoredPairs[0];
  t.is(similarity, 1.0);

  const fragments = pair.fragments();
  t.is(fragments.length, 1);
  const match = fragments[0];

  t.deepEqual(new Region(2, 2, 9, 37), match.leftSelection);
  t.deepEqual(new Region(2, 2, 9, 37), match.rightSelection);

  t.is(0, match.leftkgrams.from);
  t.is(0, match.rightkgrams.from);
  t.true(match.leftkgrams.to > 3);
  t.true(match.rightkgrams.to > 3);

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

  const report = await dolos.analyze(
    [
      new File("file1.js", original),
      new File("file2.js", changed),
    ]
  );

  t.is(1, report.scoredPairs.length);
  const { pair, similarity } = report.scoredPairs[0];
  t.is(similarity, 1.0);

  const fragments = pair.fragments();
  t.is(fragments.length, 1);
  const match = fragments[0];

  t.deepEqual(new Region(2, 2, 9, 37), match.leftSelection);
  t.deepEqual(new Region(2, 2, 9, 37), match.rightSelection);

  t.is(0, match.leftkgrams.from);
  t.is(0, match.rightkgrams.from);
  t.true(match.leftkgrams.to > 3);
  t.true(match.rightkgrams.to > 3);
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

  const report = await dolos.analyze(
    [
      new File("file1.js", original),
      new File("file2.js", changed),
    ]
  );

  t.is(1, report.scoredPairs.length);
  const { pair, similarity } = report.scoredPairs[0];
  t.is(similarity, 1.0);

  const fragments = pair.fragments();
  t.is(fragments.length, 1);
  const match = fragments[0];

  t.is(0, match.leftkgrams.from);
  t.is(0, match.rightkgrams.from);
  t.true(match.leftkgrams.to > 3);
  t.true(match.rightkgrams.to > 3);
});

test("changed order should be a good match", async t => {
  const dolos = new Dolos({ kgramLength: 10, kgramsInWindow: 5 });
  const original = `

  function helloWorld() {
    console.log(hello() + " " + world())
  }
  
  function hello() {
    return "hello";
  }

  const world = () => "world";
  `;

  const changed = `

  function hello() {
    return "hello";
  }

  const world = () => "world";

  function helloWorld() {
    console.log(hello() + " " + world())
  }
  `;

  const report = await dolos.analyze(
    [
      new File("file1.js", original),
      new File("file2.js", changed),
    ]
  );

  t.is(1, report.scoredPairs.length);
  const { pair, similarity } = report.scoredPairs[0];
  t.true(similarity > 0.75);

  // four fragments: program declaration, hello(), world() and helloWorld()
  t.is(4, pair.fragments().length);

});

test("should read CSV-files", async t => {
  const dolos = new Dolos();

  const report = await dolos.analyzePaths(["../samples/javascript/info.csv"]);

  t.is(4, report.files.length);

  t.is(5, report.scoredPairs.length);
  const { similarity } = report.scoredPairs[0];
  t.true(similarity > 0.75);
});

test("should read ZIP-files", async t => {
  const dolos = new Dolos();

  const report = await dolos.analyzePaths(["../samples/javascript/simple-dataset.zip"]);

  t.is(4, report.files.length);

  t.is(5, report.scoredPairs.length);
  const { similarity } = report.scoredPairs[0];
  t.true(similarity > 0.75);
});
