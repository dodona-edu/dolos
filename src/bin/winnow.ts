import fs from "fs";
import { Hash } from "../lib/filters/hashFilter";
import { WinnowFilter } from "../lib/filters/winnowFilter";

const winnow = new WinnowFilter(20, 40);

(async () => {
  const output: Hash[] = [];
  for await (const v of winnow.hashes(fs.createReadStream("/dev/stdin"))) {
    output.push(v);
  }
  console.log(output.join("\n"));
})();
