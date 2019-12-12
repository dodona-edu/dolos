import test from "ava";
import { File } from "../lib/files/file";

test("read file", async t => {
  const file = await File.alone("src/test/fixtures/plaintext/test.txt");
  t.snapshot(file.readResult.ok());
});

test("count lines", async t => {
  const file = await File.alone("src/test/fixtures/plaintext/test.txt");
  t.is(4, file.lineCount.ok());
});

test("non-existent file", async t => {
  const file = await File.alone("blargh/blurgh/bleergh");
  t.truthy(file, "file object should be created");
  t.true(file.readResult.isError());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const err = file.readResult.err() as any;
  t.is("ENOENT", err.code);
});
