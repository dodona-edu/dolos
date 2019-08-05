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

// import { default as fsWithCallbacks } from "fs";
const fs = require('fs');
var colors = require('colors/safe');

 export class Visualize {
     //private similarLines: number[];
     // private similarLinesAppearedTimes: number[];
     // private similarLinesReferencedTimesByPeople: number[];
     private sourceFile:string;
     //private sourceFileData:string;

    constructor(sourceFile: string) { //, comparedFile: string, similarLines: Array<Array<number>>
        //this.similarLines = [];
        // this.similarLinesAppearedTimes = [];
        // this.similarLinesReferencedTimesByPeople = [];
        this.sourceFile = sourceFile;
        //this.sourceFileData = "";
    }

    /**
     * Returns the string form of our source document
     * INPUT: none
     * OUTPUT: contents of source file, in string form
     */
    public getSourceFile() {
        // Below partially referenced from StackOverFlow: 
        // https://stackoverflow.com/questions/3582671/how-to-open-a-local-disk-file-with-javascript
        // let fileContent;
        fs.readFile(this.sourceFile, "utf8", function(err: any, data: any) {
            if (err) throw err;
            // see https://www.npmjs.com/package/colors for documentation
            console.log(colors.red(data.toString()));
            // fileContent = data.toString();
          });
        // console.log(fileContent);
    }

    /**
     * Returns the string form of our compared document
     * INPUT: none
     * OUTPUT: contents of compared file, in string form
     */
    public getComparedFile(comparedFile: string) {
        // takes in a path, and returns contents of path as plaintext
        fs.readFile(comparedFile, "utf8", function(err: any, data: any) {
            if (err) throw err;
            console.log(colors.red(data.toString()));
            // fileContent = data.toString();
          });
    }

    /**
     * Returns a sorted list of the lines that have similarity
     * @param index The index of our file; source file is 1, and compared file is 0 by default
     * @param similarLines The array given as result from winnowing
     */
    public addInValues(index: number, similarLines: Array<Array<number>>): Array<number> {
        var sortedArray: Array<number> = [];
        for (let i=0; i<similarLines.length; ++i) {
            let similarLine: Array<number> = similarLines[i];
            if (this.find(similarLine[index], sortedArray) === -1) {
                // put in new value into our array
                sortedArray.push(similarLine[index]);
            }
        }

        return []; // stub
    }

    /**
     * Returns the index of the number we wish to find; otherwise return -1
     * @param findNumber The numer we wish to find in the array
     * @param array The array we access for finding the number
     */
    public find(findNumber: number, array: Array<number>): number {
        // returns index of the first instance of specified number, if it exists. -1 otherwise.
        let foundLineOn = -1; // Default return value
        for (let i=0; i<array.length; ++i) {
            if (array[i] === findNumber) {
                foundLineOn = i;
                console.log(`found line on ${i}.`);
                return foundLineOn;
            }
        }
        return foundLineOn;
    }
 }