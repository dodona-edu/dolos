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

manager.executeBenchmarks();
