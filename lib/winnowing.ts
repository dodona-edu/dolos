import RollingHash from "./rollingHash";

export default class Winnowing {
    private readonly w: number = 25;
    private hash: RollingHash; 
    private str: string;
    private arr: number[];
    private solnArr: number[];

    
    constructor(hash: RollingHash, str: string, w?: number) {
        this.w = w ? w: this.w;
        this.hash = hash;
        this.str = str;
        this.arr = new Array(w);
        this.solnArr = new Array(str.length);
    }

    /*
     * Finds our smallest hash value in our window
     * @param void There are no parameters for our function, all are in class
     */

     public winnow(): void {
         let maxVal = Math.pow(2, 31) - 1;  // NOT THE SMALLEST VALUE AVAILABLE
         for(let j: number = 0; j < this.w; ++j) {
             this.arr[j] =  maxVal;
         }
         let r: number = 0;
         let min: number = 0;
         let currentIteration: number = 0;

         while (1) {
             r = (r + 1 % this.w);
             this.arr[r] =  this.hash.nextHash(r);
             if (0) { 
                 // terminating condition; I suspect that we need one?
             }
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
       */

      public globalPos(min: number, r: number, w: number, currentIteration: number) {
          return (currentIteration + (min - r + w - 1) % w);
      }
}