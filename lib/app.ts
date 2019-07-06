import RollingHash from "./rollingHash";

const k = 20;
const hash = new RollingHash(k);

async function* winnow(windowSize: number): AsyncIterableIterator<[number, number]> {
    const buffer: number[] = new Array(windowSize).fill(Number.MAX_SAFE_INTEGER);
    let filePos: number = -1 * k;
    let bufferPos: number = 0;
    let minPos: number = 0;

    // At the end of each iteration, minPos holds the position of the rightmost minimal
    // hash in the current window.
    // yield([x,pos]) is called only the first time an instance of x is selected
    for await (const data of process.stdin) {
        for (const byte of data as Buffer) {
            filePos++;
            if (filePos < 0) {
                hash.nextHash(byte);
                continue;
            }
            bufferPos = (bufferPos + 1) % windowSize;
            buffer[bufferPos] = hash.nextHash(byte);
            if (minPos === bufferPos) {
                // The previous minimum is no longer in this window.
                // Scan buffer starting from bufferPos for the rightmost minimal hash.
                // Note minPos starts with the index of the rightmost hash.
                for (let i = (bufferPos + 1) % windowSize; i !== bufferPos; i = (i + 1) % windowSize) {
                    if (buffer[i] <= buffer[minPos]) {
                        minPos = i;
                    }
                }
                yield [buffer[minPos], filePos + (minPos - bufferPos - windowSize) % windowSize];
            } else {
                // Otherwise, the previous minimum is still in this window. Compare
                // against the new value and update minPos if necessary.
                if (buffer[bufferPos] <= buffer[minPos]) {
                    minPos = bufferPos;
                    yield [buffer[minPos], filePos + (minPos - bufferPos - windowSize) % windowSize];
                }
            }
        }
    }
}

(async () => {
    for await (const v of winnow(40)) {
        console.log(v);
    }
})();
