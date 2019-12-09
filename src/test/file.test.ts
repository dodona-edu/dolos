import test from "ava";
import File from "../lib/files/file";

test("read file", async t => {
  const file = await File.alone("src/test/fixtures/plaintext/test.txt");
  t.snapshot(file.readResult.ok());
});

test("count lines", async t => {
  const file = await File.alone("src/test/fixtures/plaintext/test.txt");
  t.is(4, file.lineCount.ok());
});

test("absolute location", async t => {
  const path = "src/test/fixtures/plaintext/test.txt";
  const file = await File.alone(path);
  t.true(file.location.startsWith("/"));
  t.true(file.location.endsWith(path));
});

test("non-existent file", async t => {
  const file = await File.alone("blargh/blurgh/bleergh");
  t.truthy(file, "file object should be created");
  t.true(file.readResult.isError());
  const err = file.readResult.err() as any;
  t.is("ENOENT", err.code);
});
