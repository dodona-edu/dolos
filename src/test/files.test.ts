import test from "ava";
import File from "../lib/file";

test("read file", async t => {
  const file = new File("src/test/fixtures/plaintext/test.txt");
  t.snapshot(await file.content());
});

test("count lines", async t => {
  const file = new File("src/test/fixtures/plaintext/test.txt");
  t.is(4, (await file.lines()).ok());
});

test("absolute location", t => {
  const path = "src/test/fixtures/plaintext/test.txt";
  const file = new File(path);
  t.true(file.location.startsWith("/"));
  t.true(file.location.endsWith(path));
});

test("non-existent file", async t => {
  const file = new File("blargh/blurgh/bleergh");
  t.truthy(file, "file object should be created");
  t.true((await file.content()).isError());
  const err = (await file.content()).err() as any;
  t.is("ENOENT", err.code);
});
