import { BenchmarkManager, NumericRangesTuple } from "../benchmarkManager";

const manager = new BenchmarkManager(true);

manager.benchmark("basic file match", async matcher => {
  await matcher.match("samples/js/sample.js", "samples/js/copied_function.js");

  matcher.expect([[[15, 20], [4, 9]]] as NumericRangesTuple[]).toBePresentInMatch();
});

manager.benchmark("nothing in common", async matcher => {
  await matcher.match("samples/js/another_copied_function.js", "samples/js/copied_function.js");

  matcher.expect([] as NumericRangesTuple[]).toBePresentInMatch();
});

manager.benchmark("simple rename", async matcher => {
  await matcher.match(
    "samples/js/benchmarkFiles/simple_rename.js",
    "samples/js/copied_function.js",
  );

  matcher.expect([[[4, 10], [4, 10]]] as NumericRangesTuple[]).toBePresentInMatch();
});

manager.benchmark("partial copy", async matcher => {
  await matcher.match("samples/js/sample.js", "samples/js/benchmarkFiles/partial_copy.js");
  const expectedResults: NumericRangesTuple[] = [[[1, 13], [1, 13]], [[24, 46], [16, 34]]];

  matcher.expect(expectedResults).toBePresentInMatch();
});

manager.executeBenchmarks();
