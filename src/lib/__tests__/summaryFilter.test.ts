import { SummaryFilter } from './../summaryFilter';
import { Matches } from './../comparison'
import { Range } from './../range';
import { RangesTuple } from '../summary';

test("simple contains test", () => {
    const array: Array<[number, number]> = [
        [1, 3],
        [1, 5],
        [1, 3],
        [1, 4],
        [1, 6],
        [1, 4],
    ]; 
    expect(SummaryFilter.contains(array, [1,3])).toBeTruthy();
    expect(SummaryFilter.contains(array, [1,4])).toBeTruthy();
    expect(SummaryFilter.contains(array, [1,5])).toBeTruthy();
    expect(SummaryFilter.contains(array, [1,6])).toBeTruthy();
    expect(SummaryFilter.contains(array, [1,7])).toBeFalsy();
});

test("simple unique test", () => {
    const array: Array<[number, number]> = [
        [1, 3],
        [1, 5],
        [1, 3],
        [1, 4],
        [1, 6],
        [1, 4],
    ];
    
    const uniqueArray = SummaryFilter.unique(array);
    expect(uniqueArray.length).toBe(4);
    expect(uniqueArray.filter((item) => item[0] === 1 && item[1] === 3).length).toBe(1);
    expect(uniqueArray.filter((item) => item[0] === 1 && item[1] === 4).length).toBe(1);
});

test("filter by base file test",() => {

    const rangesTupleArray: Array<RangesTuple> = [
        [new Range(0, 2000), new Range(20, 30)]
    ];

    const matchingLinesArray: Array<[number, number]> = [
        [1, 40],
        [20, 400],
        [20, 400],
        [20, 400],
        [20, 400],
        [20, 400],
        [20, 400],
        [25, 500],
        [30, 600],
        [31, 45],
    ];


    const filteredMatchingLinesArray = SummaryFilter.filterByBaseFile(matchingLinesArray, rangesTupleArray);
    expect(filteredMatchingLinesArray.length).toBe(2);
    expect(filteredMatchingLinesArray).toContainEqual(matchingLinesArray[0]);
    expect(filteredMatchingLinesArray).toContainEqual(matchingLinesArray[9]);

});


test("filter by maximum passage percentage", () => {
    const filter: SummaryFilter = new SummaryFilter(0, 0, 0.5);
    const dummyResults: Map<string, Matches<number>> = new Map([
        ['dummyFile1', new Map([
            ['dummyFile2', [[4, 9], [5, 10]]],
            ['dummyFile3', [[30, 31], [6, 20]]]
        ])],
        ['dummyFile3', new Map([
            ['dummyFile2', [[5, 10]]]
        ])]
    ]);

    const filteredDummyResults = filter.filterByMaximumPassagePercentage(dummyResults, 3);
    console.log(filteredDummyResults);
    expect(filteredDummyResults.has('dummyFile1'));
    let dummyMatches: Matches<number> = filteredDummyResults.get('dummyFile1') as Matches<number>;
    expect(dummyMatches.has('dummyFile2')).toBeTruthy();

    let dummyLines: Array<[number, number]> = dummyMatches.get('dummyFile2') as Array<[number, number]>;
    expect(dummyLines).toContainEqual([4, 9]);
    expect(dummyLines).not.toContainEqual([5, 10]);

    expect(filteredDummyResults.has('dummyFile3')).toBeFalsy();
})