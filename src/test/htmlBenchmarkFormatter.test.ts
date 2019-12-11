import test from "ava";
import { BenchmarkManager, NumericRangesTuple } from
  "../lib/benchmarks/benchmarkManager";
import { HTMLBenchmarkFormatter } from
  "../lib/benchmarks/htmlBenchmarkFormatter";

test("general structure test", async t => {
  const manager = new BenchmarkManager(false);
  const formatter: HTMLBenchmarkFormatter = new HTMLBenchmarkFormatter(true);

  manager.benchmark("dummy benchmark", async helper => {
    await helper.match("samples/js/sample.js", "samples/js/copied_function.js");
    helper.expect([[[15, 20], [4, 9]]] as NumericRangesTuple[])
      .toBePresentInMatch();
  });

  manager.benchmarkSettings =
    [manager.benchmarkSettingNoFilter, { gapSize: 5 }];

  await manager.executeBenchmarks();

  const output: string = formatter.format(manager.json as string);
  t.snapshot(output);
});
