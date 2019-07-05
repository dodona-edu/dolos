import RollingHash from "./rollingHash";
import Winnowing from "./winnowing";
const fs = require("fs");

const k = 20;
const hash = new RollingHash(k);
let solnArr: number[] = [];

fs.readFile('./sample.txt', (err: any, data: any) => {
    if (err) throw err;
// process.stdin.on("data", data => {
    /*
    // let s = "";
    data.forEach((b: number) => {
        let value: number = hash.nextHash(b);
        console.error(value);
        solnArr.push(value);
    });
    console.log(solnArr.length);
    */
    
    // console.error(data);
    solnArr = new Array(data.length);
    const winnowing = new Winnowing(data, solnArr, 2, hash);
    winnowing.winnow();
    console.error(solnArr);
    // console.error("\n checking array");
    
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