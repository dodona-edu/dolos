#!/usr/bin/env node
import fs from "fs";
import { WinnowFilter } from "../lib/winnowFilter";

const winnow = new WinnowFilter(50, 40);

(async () => {
  for await (const hash of winnow.hashes(fs.createReadStream("/dev/stdin"))) {
    process.stdout.write(hash.hash.toString());
  }
})();
