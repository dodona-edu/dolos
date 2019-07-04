import RollingHash from "./rollingHash";
// import { strict } from "assert";

export default class Winnowing {
    private readonly k: number = 20;
    private hash: RollingHash = new RollingHash(this.k); 
    private data: any;
    private arr: number[];
    private solnArr: number[];

    
    constructor(data: any, solnArr: number[], hash?: RollingHash, k?: number) {
        this.k = k ? k: this.k;
        this.hash = hash ? hash: this.hash;
        this.data = data;
        this.arr = new Array(k);
        this.solnArr = solnArr;
    }

    /*
     * Finds our smallest hash value in our window
     * 
     * @param void There are no parameters for our function, all are in class
     */

    public winnow(): void {
        let maxVal = Math.pow(2, 31) - 1;  // NOT THE LARGEST VALUE AVAILABLE
                                           // Largest prime under MAX_SAFE_INTEGER: 9007199254740881
        for(let j: number = 0; j < this.k; ++j) {
            this.arr[j] =  maxVal;
        }

        let r: number = 0;
        let min: number = 0;
        let currentIteration: number = 0;

        for (currentIteration = 0; currentIteration < this.data.length; ++currentIteration) {
            r = (r + 1 % this.k);
            this.arr[r] =  this.hash.nextHash(this.data[currentIteration]);
            if (min === r) {
                for (let i = (r - 1) % this.k; i !== r; i = (i - 1 + this.k) % this.k) {
                    if (this.arr[i] < this.arr[min]) {
                       min = i;
                    }
                }
                return this.record(this.arr[min], this.globalPos(min, r, this.k, currentIteration));
            }

            else {
                if (this.arr[r] < this.arr[min]) {
                    min = r;
                    return this.record(this.arr[min], this.globalPos(min, r, this.k, currentIteration));
                }
            }
            currentIteration++;
        }
    }

    /*
     * Compute the global position using the relative position, min.
     * Saving this position, together with the selected hash, creates a fingerprint
     * 
     * @param minVal the minimum hash value of current window
     * @param globalPos the global position
     */

    public record(minVal: number, globalPos: number) {
        this.solnArr[globalPos] = minVal; 
        return;
    }

    /*
     * Create a global position for our hash
     * 
     * @param min the minimum hash value on here
     * @param r the rightmost element in circular array
     * @param k the size of the word
     * @param currentIternation is total size of array
     */

    public globalPos(min: number, r: number, k: number, currentIteration: number) {
        return (currentIteration + (min - r + k - 1) % k);
    }
}