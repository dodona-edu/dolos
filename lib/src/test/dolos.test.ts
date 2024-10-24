import test from "ava";
import { Dolos } from "../lib/dolos.js";
import { File, Region } from "@dodona/dolos-core";

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

  const f1 = new File("file1.js", content);
  const f2 = new File("file2.js", content);
  const report = await dolos.analyze([f1, f2]);

  t.is(report.files.length, 2);

  const pair = report.getPair(report.files[0], report.files[1]);
  t.is(pair.similarity, 1.0);

  const fragments = pair.buildFragments();
  t.is(fragments.length, 1);
  const match = fragments[0];

  t.deepEqual(new Region(2, 2, 9, 32), match.leftSelection);
  t.deepEqual(new Region(2, 2, 9, 32), match.rightSelection);

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
    console.log(hallo() + " " + wereld())
  }
  `;

  const f1 = new File("file1.js", original);
  const f2 = new File("file2.js", changed);
  const report = await dolos.analyze([f1, f2]);

  t.is(report.files.length, 2);

  const pair = report.getPair(report.files[0], report.files[1]);

  t.is(pair.similarity, 1.0);

  const fragments = pair.buildFragments();
  t.is(fragments.length, 1);
  const match = fragments[0];

  t.deepEqual(new Region(2, 2, 9, 32), match.leftSelection);
  t.deepEqual(new Region(2, 2, 9, 32), match.rightSelection);

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

  const f1 = new File("file1.js", original);
  const f2 = new File("file2.js", changed);
  const report = await dolos.analyze([f1, f2]);

  t.is(report.files.length, 2);

  const pair = report.getPair(report.files[0], report.files[1]);

  t.is(pair.similarity, 1.0);

  const fragments = pair.buildFragments();
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

  const f1 = new File("file1.js", original);
  const f2 = new File("file2.js", changed);
  const report = await dolos.analyze([f1, f2]);

  t.is(report.files.length, 2);

  const pair = report.getPair(report.files[0], report.files[1]);

  t.true(pair.similarity > 0.75);

  const fragments = pair.buildFragments();

  // four fragments: program declaration, hello(), world() and helloWorld()
  t.is(4, fragments.length);

});

test("should read two files", async t => {
  const dolos = new Dolos();

  const report = await dolos.analyzePaths([
    "../samples/javascript/sample.js",
    "../samples/javascript/copied_function.js"
  ]);

  t.is(2, report.files.length);
  t.is(report.name, "sample.js & copied_function.js");

  const pairs = report.allPairs();
  t.is(1, pairs.length);
});

test("should read two files and overwrite name", async t => {
  const dolos = new Dolos({ reportName: "blargh" });

  const report = await dolos.analyzePaths([
    "../samples/javascript/sample.js",
    "../samples/javascript/copied_function.js"
  ]);

  t.is(2, report.files.length);
  t.is(report.name, "blargh");
  t.is(report.metadata()["reportName"], "blargh");

  const pairs = report.allPairs();
  t.is(1, pairs.length);
});


test("should read CSV-files", async t => {
  const dolos = new Dolos();

  const report = await dolos.analyzePaths(["../samples/javascript/info.csv"]);

  t.is(4, report.files.length);
  t.is(report.name, "javascript");
  t.is(report.metadata()["reportName"], "javascript");


  const pairs = report.allPairs();
  t.is(6, pairs.length);
  t.true(pairs[0].similarity > 0.75);
});

test("should read CSV-files with template code", async t => {
  const dolos = new Dolos();

  const report = await dolos.analyzePaths(["./src/test/fixtures/javascript/info_with_template.csv"]);

  const files = report.files;
  t.is(5, files.length);

  const boilerplate = files[0];
  const unique = files[1];
  const alternative = files[2];
  const similar  = files[3];

  // Boilerplate copy should not have a match
  t.is(0, report.getPair(boilerplate, unique).similarity);
  t.is(0, report.getPair(boilerplate, alternative).similarity);
  t.is(0, report.getPair(boilerplate, similar).similarity);


  const unique_alternative = report.getPair(unique, alternative);
  const unique_similar = report.getPair(unique, similar);
  const alternative_similar = report.getPair(alternative, similar);
  t.true(unique_alternative.similarity < alternative_similar.similarity, "Pairs with unique should be less similar");
  t.true(unique_similar.similarity < alternative_similar.similarity, "Pairs with unique should be less similar");
  t.true(alternative_similar.similarity > 0.5, "Pairs with similar code should have a similarity above 50%");
});

test("should read ZIP-files with info.csv", async t => {
  const dolos = new Dolos();

  const report = await dolos.analyzePaths(["../samples/javascript/simple-dataset.zip"]);

  t.is(4, report.files.length);
  t.is(report.name, "simple-dataset");
  t.is(report.metadata()["reportName"], "simple-dataset");

  const pairs = report.allPairs();
  t.is(6, pairs.length);
  t.true(pairs[0].similarity > 0.75);
});

test("should read ZIP-files without info.csv", async t => {
  const dolos = new Dolos();

  const report = await dolos.analyzePaths(["../samples/javascript/simple-dataset-no-csv.zip"]);

  t.is(4, report.files.length);
  t.is(report.name, "simple-dataset-no-csv");
  t.is(report.metadata()["reportName"], "simple-dataset-no-csv");
  t.is(report.metadata()["warnings"].length, 1);

  const pairs = report.allPairs();
  t.is(6, pairs.length);
  t.true(pairs[0].similarity > 0.75);
});

test("empty files should match 0%", async t => {
  const dolos = new Dolos();
  const report = await dolos.analyze([new File("file1.js", ""), new File("file2.js", "")]);
  const pairs = report.allPairs();
  t.is(0, pairs[0].similarity);
  t.is(0, pairs[0].overlap);
  t.is(0, pairs[0].longest);
});

test("should generate warning when not all files match detected language", async t => {
  const dolos = new Dolos();

  const report = await dolos.analyzePaths([
    "../samples/javascript/sample.js",
    "../samples/javascript/copied_function.js",
    "../samples/java/Caesar.java"
  ]);

  t.is(report.metadata()["warnings"].length, 1);
  t.is(2, report.files.length);

  const pairs = report.allPairs();
  t.is(1, pairs.length);
});

test("should ignore template code", async t => {
  const dolos = new Dolos();

  const report = await dolos.analyzePaths([
    "./src/test/fixtures/javascript/boilerplate_copy.js",
    "./src/test/fixtures/javascript/implementation-unique.js",
    "./src/test/fixtures/javascript/implementation-alternative.js",
    "./src/test/fixtures/javascript/implementation-alternative-similar.js",
  ],     "./src/test/fixtures/javascript/boilerplate_copy.js");

  const files = report.files;
  t.is(4, files.length);

  const boilerplate = files[0];
  const unique = files[1];
  const alternative = files[2];
  const similar  = files[3];

  // Boilerplate copy should not have a match
  t.is(0, report.getPair(boilerplate, unique).similarity);
  t.is(0, report.getPair(boilerplate, alternative).similarity);
  t.is(0, report.getPair(boilerplate, similar).similarity);


  const unique_alternative = report.getPair(unique, alternative);
  const unique_similar = report.getPair(unique, similar);
  const alternative_similar = report.getPair(alternative, similar);
  t.true(unique_alternative.similarity < alternative_similar.similarity, "Pairs with unique should be less similar");
  t.true(unique_similar.similarity < alternative_similar.similarity, "Pairs with unique should be less similar");
  t.true(alternative_similar.similarity > 0.5, "Pairs with similar code should have a similarity above 50%");
});

test("should ignore with maxFingerprintCount", async t => {
  const dolos = new Dolos({
    maxFingerprintCount: 3
  });

  const report = await dolos.analyzePaths([
    "./src/test/fixtures/javascript/boilerplate_copy.js",
    "./src/test/fixtures/javascript/implementation-unique.js",
    "./src/test/fixtures/javascript/implementation-alternative.js",
    "./src/test/fixtures/javascript/implementation-alternative-similar.js",
  ]);

  const files = report.files;
  t.is(4, files.length);

  const boilerplate = files[0];
  const unique = files[1];
  const alternative = files[2];
  const similar  = files[3];

  // Boilerplate copy should not have a match
  t.is(0, report.getPair(boilerplate, unique).similarity);
  t.is(0, report.getPair(boilerplate, alternative).similarity);
  t.is(0, report.getPair(boilerplate, similar).similarity);


  const unique_alternative = report.getPair(unique, alternative);
  const unique_similar = report.getPair(unique, similar);
  const alternative_similar = report.getPair(alternative, similar);
  t.true(unique_alternative.similarity < alternative_similar.similarity, "Pairs with unique should be less similar");
  t.true(unique_similar.similarity < alternative_similar.similarity, "Pairs with unique should be less similar");
  t.true(alternative_similar.similarity > 0.5, "Pairs with similar code should have a similarity above 50%");
});

test("should ignore with maxFingerprintPercentage", async t => {
  const dolos = new Dolos({
    maxFingerprintPercentage: 0.75
  });

  const report = await dolos.analyzePaths([
    "./src/test/fixtures/javascript/boilerplate_copy.js",
    "./src/test/fixtures/javascript/implementation-unique.js",
    "./src/test/fixtures/javascript/implementation-alternative.js",
    "./src/test/fixtures/javascript/implementation-alternative-similar.js",
  ]);

  const files = report.files;
  t.is(4, files.length);

  const boilerplate = files[0];
  const unique = files[1];
  const alternative = files[2];
  const similar  = files[3];

  // Boilerplate copy should not have a match
  t.is(0, report.getPair(boilerplate, unique).similarity);
  t.is(0, report.getPair(boilerplate, alternative).similarity);
  t.is(0, report.getPair(boilerplate, similar).similarity);


  const unique_alternative = report.getPair(unique, alternative);
  const unique_similar = report.getPair(unique, similar);
  const alternative_similar = report.getPair(alternative, similar);
  t.true(unique_alternative.similarity < alternative_similar.similarity, "Pairs with unique should be less similar");
  t.true(unique_similar.similarity < alternative_similar.similarity, "Pairs with unique should be less similar");
  t.true(alternative_similar.similarity > 0.5, "Pairs with similar code should have a similarity above 50%");
});

test.failing("repeating sequences should not cause too many fragments", async t => {
  const dolos = new Dolos();

  const report = await dolos.analyze(
    [
      new File("file1", `

  private class ClassWithArray {
      private int padding;
      private char[] chars = {'A','B','C','D','E','F','G','H','I','J','K','L','M',
                            'N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
                            'a','b','c','d','e','f','g','h','i','j','k','l','m',
                            'n','o','p','q','r','s','t','u','v','w','x','y','z'};
      private ClassWithArray() {
        // padding
      };
  }
  `),
      new File("file2", `
      private final class ClassWithMoreArrays {
               private final static char pwdArray [] = {
      \t        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h',
      \t        'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p',
      \t        'q', 'r', 's', 't', 'u', 'v', 'w', 'x',
      \t        'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F',
      \t        'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N',
      \t        'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V',
      \t        'W', 'X', 'Y', 'Z', ' '
        };
      
         private final static char base64Array [] = {
             'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
             'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
             'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
             'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f',
             'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n',
             'o', 'p', 'q', 'r', 's', 't', 'u', 'v',
             'w', 'x', 'y', 'z', '0', '1', '2', '3',
             '4', '5', '6', '7', '8', '9', '+', '/'
        };
      }
      `),
    ]
  );


  const pairs = report.allPairs();
  t.is(1, pairs.length);

  const fragments = pairs[0].buildFragments();
  t.is(fragments.length, 2);
});
