import { Matches } from './comparison';

type Range = [number, number];
export class Summary {
    results: Map<string, Matches<number>>;
    constructor(results: Map<string, Matches<number>>){
        this.results = new Map(results);
    }



    printSummary(): void {

        this.results.forEach((value, key) => {
            console.log(`key: ${key}`);
            value.forEach((value2, key2) => {
                console.log(`key2: ${key2}`);
                process.stdout.write('range: ');
                console.log(this.toRange(value2));
            })
        });
    }

    /**
     * converts a list of matching lines to a list of ranges 
     * @param matches the list of matching lines
     * @returns a list of tuples that contains two ranges, where the frist and second range correspond to the line numbers of each file.
     */
    toRange(matches: Array<[number, number]>): Array<[Range, Range]> {
        let ranges: Array<[[number, number], [number, number]]> = new Array();


        // sort on first element of tuple and remove duplicates
        matches = matches.sort((val1, val2) => val1[0] - val2[0]).filter((item, pos, arr) => {
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
        return ranges.filter((item) => item[0][0] !== item[0][1]);
    }
}