import { Suite, Event } from "benchmark";
import crypto from "crypto";

import { Fingerprint } from "../lib/hashing/hashFilter";
import { NoFilter } from "../lib/hashing/noFilter";


async function setup(): Promise<Fingerprint[]> {
  const text = crypto.randomBytes(1024 * 1024).toString("hex").split("");
  const hashes = new NoFilter(10);
  const data = [];
  for await (const hash of hashes.fingerprints(text)) {
    data.push(hash);
  }
  return data;
}

(async () => {

  console.log("Generating data");
  const data = await setup();

  console.log("Initalizing test suite");

  const suite = new Suite();

  suite.add("Object", () => {
    const obj: {[k: number]: Fingerprint[] | undefined} = {};
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      let list = obj[item.hash];
      if(list === undefined){
        list = [];
        obj[item.hash] = list;
      }
      list.push(item);
    }
  });

  suite.add("Map", () => {
    const map: Map<number, Fingerprint[]> = new Map();
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      let list = map.get(item.hash);
      if(!list){
        list = [];
        map.set(item.hash, list);
      }
      list.push(item);
    }
  });

  suite.on("cycle", (event: Event) => {
    console.log(event.target?.toString());
  });

  const done = new Promise<void>((r, e) => {
    suite.on("complete", function () {
      r();
    });
    suite.on("error", e);
  });

  console.log("Running test suite!");
  suite.run();
  await done;


})();
