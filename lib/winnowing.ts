import RollingHash from "./rollingHash";

export default class Winnowing {
    private readonly w: number = 25;
    private hash: RollingHash; 
    private str: string;
    map: Map<number, number> = new Map();

    
    constructor(hash: RollingHash, str: string, w?: number) {
        this.w = w ? w: this.w;
        this.hash = hash;
        this.str = str;
    }

    /*
     * Finds our smallest hash value in our window
     * @param 
     */

     public winnow(): void {
         let maxVal = Math.pow(2, 31) - 1;  // NOT THE SMALLEST VALUE AVAILABLE
         for(let j: number = 0; j < this.w; ++j) {
             this.map.set(j, maxVal);
         }
         let r: number = 0;
         let min: number = 0;

         while (1) {
             r = (r + 1 % this.w);
             this.map.set(r, this.hash.nextHash(r));
             if (0) { 
                 // terminating condition
             }
             if (min === r) {
                 for (let i = (r - 1) % this.w; i !== r; i = (i - 1 + this.w) % this.w) {
                     if (this.map.get(i) && this.map.get(min)) {
                         if (this.map.get(i)! < this.map.get(min)!) {
                            min = i;
                         }
                     }
                 }
                 return record(this.map.get(min), globalPos(min, r, this.w));
             }

             else {
                 if (this.map.get(r)! <= this.map.get(min)!) {
                     min = r;
                     return record(this.map.get(min), globalPos(min, r, this.w));
                 }
             }
         }
     }

     /*
      *
      */
}