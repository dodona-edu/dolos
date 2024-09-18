import test from "ava";
import { Dolos } from "../lib/dolos.js";

test("rank by total overlap", async t => {
  const dolos = new Dolos();
  const report = await dolos.analyzePaths(["../cli/exercise - Pyramidal constants/info.csv"]);
  t.is(report.files.length, 392);
  const index = dolos.index!;

  const ranked = index.pairsByOverlap();
  for (let i = 0; i < ranked.length; i++) {
    t.true(ranked[i].overlap >= ranked[i + 1].overlap, `Fail for pair ${i}: ${ranked[i].overlap} < ${ranked[i + 1].overlap}`);
  }


});
