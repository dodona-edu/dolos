import { BenchmarkManager, NumericRangesTuple } from "../benchmarks/benchmarkManager";
import { HTMLBenchmarkFormatter } from "../benchmarks/htmlBenchmarkFormatter";

test("general structure test", async () => {
  const manager = new BenchmarkManager(false);
  const formatter: HTMLBenchmarkFormatter = new HTMLBenchmarkFormatter(true);

  console.log = jest.fn;
  manager.benchmark("dummy benchmark", async helper => {
    await helper.match("samples/js/sample.js", "samples/js/copied_function.js");
    helper.expect([[[15, 20], [4, 9]]] as NumericRangesTuple[]).toBePresentInMatch();
  });

  manager.benchmarkSettings = [manager.benchmarkSettingNoFilter, { gapSize: 5 }];

  await manager.executeBenchmarks();

  const output: string = formatter.format(manager.json as string);
  expect(output).toMatchSnapshot();
});
