import fs from "fs";
import { WinnowFilter } from "./lib/winnowFilter";

const winnow = new WinnowFilter(20, 40);

(async () => {
  const output: Array<[number, number]> = [];
  for await (const v of winnow.hashes(fs.createReadStream("/dev/stdin"))) {
    output.push(v);
  }
})();
