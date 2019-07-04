import RollingHash from "./rollingHash";

export default class Winnowing {
    private readonly w: number = 20;
    private hash: RollingHash = new RollingHash(this.w); 
    private data: any;
    private arr: number[];
    private solnArr: number[];

    
    constructor(data: any, solnArr: number[], hash?: RollingHash, w?: number) {
        this.w = w ? w: this.w;
        this.hash = hash ? hash: this.hash;
        this.data = data;
        this.arr = new Array(w);
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
        for(let j: number = 0; j < this.w; ++j) {
            this.arr[j] =  maxVal;
        }

        let r: number = 0;
        let min: number = 0;
        let currentIteration: number = 0;

        for (currentIteration = 0; currentIteration < this.data.length; ++currentIteration) {
            r = (r + 1 % this.w);
            this.arr[r] =  this.hash.nextHash(this.data[currentIteration]);
            if (min === r) {
                for (let i = (r - 1) % this.w; i !== r; i = (i - 1 + this.w) % this.w) {
                    if (this.arr[i] < this.arr[min]) {
                       min = i;
                    }
                }
                return this.record(this.arr[min], this.globalPos(min, r, this.w, currentIteration));
            }

            else {
                if (this.arr[r] < this.arr[min]) {
                    min = r;
                    return this.record(this.arr[min], this.globalPos(min, r, this.w, currentIteration));
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
     * @param w the size of the word
     * @param currentIternation is total size of array
     */

    public globalPos(min: number, r: number, w: number, currentIteration: number) {
        return (currentIteration + (min - r + w - 1) % w);
    }
}