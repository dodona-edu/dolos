import fs from "fs";
import { Hash } from "../lib/hashFilter";
import { WinnowFilter } from "../lib/winnowFilter";

const winnow = new WinnowFilter(20, 40);

(async () => {
  const output: Hash[] = [];
  for await (const v of winnow.hashes(fs.createReadStream("/dev/stdin"))) {
    output.push(v);
  }
  console.log(output.join("\n"));
})();
