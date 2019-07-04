import RollingHash from "./rollingHash";
import Winnowing from "./winnowing";

const k = 20;
const hash = new RollingHash(k);
let solnArr: number[];

process.stdin.on("data", data => {
    solnArr = new Array(data.length);
    let s = "";
    data.forEach((b: number) => {
        s += hash.nextHash(b) + "\n";
    });
    console.log(s);
});

/*

import RollingHash from "./rollingHash";

const k = 20;
const hash = new RollingHash(k);

process.stdin.on("data", data => {
    let s = "";
    data.forEach((b: number) => {
        s += hash.nextHash(b) + "\n";
    });
    console.log(s);
});

*/