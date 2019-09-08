import { BenchmarkManager, NumericRangesTuple } from "../benchmarkManager";
import { HTMLBenchmarkFormatter } from "./../htmlBenchmarkFormatter";
test("general structure test", async () => {
  const manager = new BenchmarkManager(false);
  const formatter: HTMLBenchmarkFormatter = new HTMLBenchmarkFormatter();

  manager.benchmark("dummy benchmark", async helper => {
    await helper.match("samples/js/sample.js", "samples/js/copied_function.js");
    helper.expect([[[15, 20], [4, 9]]] as NumericRangesTuple[]).toBePresentInMatch();
  });

  manager.benchmarkSettings = [manager.benchmarkSettingNoFilter, { gapSize: 5 }];

  await manager.executeBenchmarks();

  const output: string = formatter.format(manager.json);
  expect(output).toMatchSnapshot();
});
