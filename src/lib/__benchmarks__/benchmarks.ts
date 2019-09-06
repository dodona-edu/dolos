import { BenchmarkManager, NumericRangesTuple } from "../benchmarkManager";
import { RangesTuple } from "../summary";

const manager = new BenchmarkManager();

manager.benchmark("basic file match", async () => {
  const matches: RangesTuple[] = await manager.match(
    "samples/js/sample.js",
    "samples/js/copied_function.js",
  );

  manager.expect([[[15, 20], [4, 9]]] as NumericRangesTuple[]).toBePresentIn(matches);
});

manager.benchmark("nothing in common", async () => {
  const matches: RangesTuple[] = await manager.match(
    "samples/js/another_copied_function.js",
    "samples/js/copied_function.js",
  );

  manager.expect([] as NumericRangesTuple[]).toBePresentIn(matches);
});

manager.benchmark("simple rename", async () => {
  const matches: RangesTuple[] = await manager.match(
    "samples/js/benchmarkFiles/simple_rename.js",
    "samples/js/copied_function.js",
  );

  manager.expect([[[4, 10], [4, 10]]] as NumericRangesTuple[]).toBePresentIn(matches);
});

manager.benchmark("partial copy", async () => {
  const matches: RangesTuple[] = await manager.match(
    "samples/js/sample.js",
    "samples/js/benchmarkFiles/partial_copy.js",
  );
  const expectedResults: NumericRangesTuple[] = [
    [[1, 13], [1, 13]],
    [[24, 46], [16, 34]]
  ];

  manager.expect(expectedResults).toBePresentIn(matches);
});
manager.executeBenchmarks();
