import { BenchmarkManager, NumericRangesTuple }
  from "../benchmarks/benchmarkManager";

const manager = new BenchmarkManager(true);

manager.benchmark("basic file match", async matcher => {
  await matcher.match(
    "samples/javascript/sample.js",
    "samples/javascript/copied_function.js"
  );

  matcher.expect(
    [[[15, 20], [4, 9]]] as NumericRangesTuple[]
  ).toBePresentInMatch();
});

manager.benchmark("nothing in common", async matcher => {
  await matcher.match(
    "samples/javascript/another_copied_function.js",
    "samples/javascript/copied_function.js"
  );

  matcher.expect([] as NumericRangesTuple[]).toBePresentInMatch();
});

manager.benchmark("simple rename", async matcher => {
  await matcher.match(
    "samples/javascript/benchmarkFiles/simple_rename.js",
    "samples/javascript/copied_function.js"
  );

  matcher.expect(
    [[[4, 10], [4, 10]]] as NumericRangesTuple[]
  ).toBePresentInMatch();
});

manager.benchmark("partial copy", async matcher => {
  await matcher.match(
    "samples/javascript/sample.js",
    "samples/javascript/benchmarkFiles/partial_copy.js"
  );

  const expectedResults: NumericRangesTuple[] =
    [[[1, 13], [1, 13]], [[24, 46], [16, 34]]];

  matcher.expect(expectedResults).toBePresentInMatch();
});

manager.benchmarkSettings = [manager.benchmarkSettingNoFilter, { gapSize: 5 }];

manager.executeBenchmarks();
