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
