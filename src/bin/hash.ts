#!/usr/bin/env node
import { RollingHash } from "../lib/rollingHash";

const k = 20;
const hash = new RollingHash(k);

process.stdin.on("data", data => {
  data.forEach((b: number) => {
    process.stdout.write(hash.nextHash(b) + "\n");
  });
});
