import RollingHash from "./rollingHash";

export default class Winnowing {
    private readonly k: number = 20;
    private hash: RollingHash; 
    private str: string;
    private arr: number[];
    private solnArr: number[];

    
    constructor(hash: RollingHash, str: string, k?: number) {
        this.k = k ? k: this.k;
        this.hash = hash;
        this.str = str;
        this.arr = new Array(k);
        this.solnArr = new Array(this.str.length);
    }

    /*
     * Finds our smallest hash value in our window
     
     * @param void There are no parameters for our function, all are in class
     */

     public winnow(): void {
         let maxVal = Math.pow(2, 31) - 1;  // NOT THE SMALLEST VALUE AVAILABLE
         for(let j: number = 0; j < this.k; ++j) {
             this.arr[j] =  maxVal;
         }
         let r: number = 0;
         let min: number = 0;
         let currentIteration: number = 0;

         while (1) {
             r = (r + 1 % this.k);
             this.arr[r] =  this.hash.nextHash(r);
             if (0) { 
                 // terminating condition; I suspect that we need one?
             }
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