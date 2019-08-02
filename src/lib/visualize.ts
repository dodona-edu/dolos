/**
 * IDEAS FOR THIS SECTION
 * 
 * Read source file, then read comparing file
 *  - https://stackoverflow.com/questions/3582671/how-to-open-a-local-disk-file-with-javascript
 * Bring file contents into HTML page (above link includes minor example), 
 *   and then figure out a way to display them side-by-side
 * Somewhere along the lines, find a way to highlight all lines of code 
 *   that are similar. Find a way (perhaps) to also show number of times 
 *   a piece of code is repeated
 * Extension idea: plaintext winnowing. Stretch goal for now.
 */

import { default as fsWithCallbacks } from "fs";
const fs = fsWithCallbacks.promises;

 export class Visualize {
     private similarLines: number[];
     // private similarLinesAppearedTimes: number[];
     // private similarLinesReferencedTimesByPeople: number[];
     private sourceFile:string;

    constructor(sourceFile: string) {
        this.similarLines = [];
        // this.similarLinesAppearedTimes = [];
        // this.similarLinesReferencedTimesByPeople = [];
        this.sourceFile = sourceFile;
    }

    public getSourceFile() {
        // Below partially referenced from StackOverFlow: 
        // https://stackoverflow.com/questions/3582671/how-to-open-a-local-disk-file-with-javascript
        const fileContent:string = fs.readFile(this.sourceFile).toString();
        console.log(fileContent);
    }

    

    public find(lineNumber: number): number {
        let foundLineOn = -1; // Default return value
        for (let i=0; i<this.similarLines.length; ++i) {
            if (this.similarLines[i] === lineNumber) {
                foundLineOn = i;
                console.log(`found line on ${i}.`);
            }
        }
        return foundLineOn;
    }
 }