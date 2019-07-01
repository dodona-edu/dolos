import fs from "fs";
import Winnow from "./winnow";

const winnow = new Winnow(20, 40);

(async () => {
    const output: Array<[number, number]> = [];
    for await (const v of winnow.winnow(fs.createReadStream("/dev/stdin"))) {
        output.push(v);
    }
})();
