import { Summary, RangesTuple } from './../summary'
import { Range } from './../range'

/**
 * adapted from https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
 * Shuffles array in place. ES6 version
 * @param {Array} a items An array containing the items.
 */

function shuffle<T>(a: Array<T>) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}


let seed = 1;
function random(): number {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}


test("simple join", () => {
    const summary = new Summary(new Map());
    let array: Array<[number, number]> = [
        [1, 5],
        [2, 6],
        [3, 7],
        [4, 8],
    ];
    shuffle(array);

    expect(summary.matchesToRange(array)).toContainEqual([new Range(1, 4), new Range(5, 8)]);

});

test("simple one sided join", () => {
    const summary = new Summary(new Map());
    let array: Array<[number, number]> = [
        [1, 5],
        [2, 5],
        [3, 5],
        [4, 5],
    ];
    shuffle(array);

    expect(summary.matchesToRange(array)).toContainEqual([new Range(1, 4), new Range(5, 5)]);

});

test("simple join", () => {
    const summary = new Summary(new Map());
    let array: Array<[number, number]> = [
        [1, 5],
        [1, 6],
        [1, 7],
        [1, 8],
    ];
    shuffle(array);

    expect(summary.matchesToRange(array)).toContainEqual([new Range(1, 1), new Range(5, 8)]);

});


test("filter rangesTuple", () => {
    const summary1 = new Summary(new Map(), 1);
    const summary2 = new Summary(new Map(), 2);
    const rangesTupleArray: Array<RangesTuple> = [
        [new Range(1, 1), new Range(2, 2)],
        [new Range(1, 1000), new Range(8002, 9001)]
    ];

    let summary1Array = summary1.filterByMinimumLines(rangesTupleArray);
    let summary2Array = summary2.filterByMinimumLines(rangesTupleArray);

    expect(summary2Array).not.toContainEqual(rangesTupleArray[0]);
    expect(summary2Array).toContainEqual(rangesTupleArray[1]);
    expect(summary1Array).toContainEqual(rangesTupleArray[0]);
    expect(summary1Array).toContainEqual(rangesTupleArray[1]);


});