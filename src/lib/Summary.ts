import { Matches } from './comparison';

type Range = [number, number];
export class Summary {

    private results: Map<string, Matches<Range>>;
    private minimumLines = 1;

    constructor(matches: Map<string, Matches<number>>){
        this.results = new Map();
        matches.forEach((value, key) => {
            value.forEach((value2, key2) => {
                let map = this.results.get(key2);
                const range = this.toRange(value2);
                if (range.length !== 0) {
                    if (map === undefined) {
                        map = new Map();
                        this.results.set(key2, map);
                    }
                    map.set(key, this.toRange(value2));
                }
                
            });
        });

        //TODO index the score of the ranges, arrays and submaps to make this more efficient.
        this.results.forEach((value, key) => {
            value.forEach((value2, _) => {
                // sorts the arrays based on the score of the ranges.
                value2.sort((val1, val2) => Summary.getScore(val2[0]) - Summary.getScore(val1[0]))
            });
            //sorts the submaps based on the score of the arrays, this is the sum of all the scores within the array.
            const tempMap = new Map(
                [...value.entries()].sort((val1, val2) => this.getScoreForArray(val2[1]) - this.getScoreForArray(val1[1]))
            );
            this.results.set(key, tempMap);
        });
        
        // sorts the maps based on the score of the submaps, which is the sum of the scores contained within the submaps.
        this.results = new Map (
            [...this.results.entries()].sort((val1, val2) => this.getScoreForSubMap(val2[1]) - this.getScoreForSubMap(val1[1]) )
        );



    }

    private getScoreForArray(arr: Array<[Range, Range]>): number {
        return arr.map((rangeTuple) => Summary.getScore(rangeTuple[0]))
            .reduce((acc, prev) => acc + prev);
    } 


    private getScoreForSubMap(subMap: Matches<Range>): number {
        return [...subMap.values()]
            .flatMap((ranges) => ranges.map((rangeTuple) => rangeTuple[0]))
            .map((range) => Summary.getScore(range))
            .reduce((acc, prev) => acc + prev);
    }



    printSummary(): void {
        this.results.forEach((value, key) => {
            console.log(`source: ${key}`);
            console.log();
            value.forEach((value2, key2) => {
                console.log(`\tmatched file: ${key2}`);
                console.log('\tranges: ');
                console.log(value2);
                console.log();
            })
        });
        if(this.results.size === 0) {
            console.log('There were no matches');
        }
    }

    /**
     * converts a list of matching lines to a list of ranges 
     * @param matches the list of matching lines
     * @returns a list of tuples that contains two ranges, where the frist and second range correspond to the line numbers of each file.
     */
    private toRange(matches: Array<[number, number]>): Array<[Range, Range]> {
        let ranges: Array<[[number, number], [number, number]]> = new Array();


        // sort on first element of tuple and remove duplicates
        matches = matches.sort((val1, val2) => {
            let temp = val1[0] - val2[0];
            return temp === 0 ? val1[1] - val2[1] : temp;
        }).filter((item, pos, arr) => {
            return pos === 0 || !(item[0] === arr[pos-1][0] && item[1] === arr[pos-1][1]);
        });
        

        let last = matches.shift();
        if (last) {
            let currentRanges: [Range, Range] | undefined = undefined;
            while(matches.length !== 0) {
                let first = matches.shift();
                if (first) {
                    let [first1, first2] = first;
                    let [last1, last2] = last;
                    if(!currentRanges){
                        currentRanges = [[last1, last1], [last2, last2]];
                    }
                    if( first1-1 === last1 && first2-1 === last2){
                        currentRanges[0][1] += 1;
                        currentRanges[1][1] += 1;
                    } else {
                        ranges.push(currentRanges);
                        currentRanges = [[first1, first1], [first2, first2]];
                    }
                    last = first;
                }
            }
            if(currentRanges) {
                ranges.push(currentRanges);
            }
        }
        
        // remove all ranges that only contain one line
        return ranges.filter((item) => item[0][1] - item[0][0] + 1  >= this.minimumLines );
    }


    /**
     * calculates the score, currently just returns the amount of lines in the range. A possible alternative is counting the amount of k-mers.
     * @param range the range you want to get the score of
     * @returns the score. 
     */
    private static getScore(range: Range): number {
        return range[1] - range[0] + 1;
    }
}