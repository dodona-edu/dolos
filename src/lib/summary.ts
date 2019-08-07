import fs from "fs";
import { Matches } from "./comparison";

type Range = [number, number];
export class Summary {
         private readonly results: Map<string, Matches<Range>>;
         private readonly minimumLines: number;
         private readonly gapSize: number;

         /**
          * @param matches A many-to-many comparison of a set of files. This map contains an entry for each of the 
          * input files with the key being its file name and the value a list of matches. These matches are grouped 
          * per matching file. The compareFiles function of the Comparison class can generate such mapping.
          */
         constructor(matchesPerFile: Map<string, Matches<number>>, minimumLines: number=1, gapSize: number=1) {
           this.results = this.transformMatches(matchesPerFile);
           this.results = this.sortResults();
           this.minimumLines = minimumLines;
           this.gapSize = gapSize;
         }

         //TODO return a string and rename this function to 'toString';
         public printSummary(): void {
           this.results.forEach((subMap, sourceFileName) => {
             console.log(`source: ${sourceFileName}`);
             console.log();
             subMap.forEach((rangeTupleArray, matchedFileName) => {
               let score = rangeTupleArray
                 .map(rangesTuple => this.getLinesInRange(rangesTuple[0]))
                 .reduce((accumulator, nextValue) => accumulator + nextValue);

               score = score / this.countLinesInFile(matchedFileName);

               console.log(
                 `\tmatched file: ${matchedFileName}, score: ${Math.round(score * 100)}%`,
               );
               console.log("\tranges: ");
               console.log(rangeTupleArray);
               console.log();
             });
           });
           if (this.results.size === 0) {
             console.log("There were no matches");
           }
         }

         private getLinesInRange(range: Range): number {
           return range[1] - range[0] + 1;
         }

         private countLinesInFile(fileName: string): number {
           return fs.readFileSync(fileName, "utf8").split("\n").length;
         }
         /**
          * Calculates the score, currently just returns the number of lines in the range. A possible alternative is counting
          * the number of k-mers.
          * @param range The range you want to get the score of
          * @returns The score
          */
         private getScoreForRange(range: Range): number {
           return range[1] - range[0] + 1;
         }

         private sortResults(): Map<string, Matches<Range>> {
           // TODO index the score of the ranges, arrays and submaps to make this more efficient.
           this.results.forEach((subMap, matchedFileName) => {
             subMap.forEach((rangeArray, _) => {
               // sorts the arrays based on the score of the ranges.
               rangeArray.sort(
                 (rangeTuple1, rangeTuple2) =>
                   this.getScoreForRange(rangeTuple2[0]) - this.getScoreForRange(rangeTuple1[0]),
               );
             });
             // sorts the submaps based on the score of the arrays, this is the sum of all the scores within the array.
             const tempSubMap = new Map(
               [...subMap.entries()].sort(
                 (subMapEntry1, subMapEntry2) =>
                   this.getScoreForArray(subMapEntry2[1]) - this.getScoreForArray(subMapEntry1[1]),
               ),
             );
             this.results.set(matchedFileName, tempSubMap);
           });

           // sorts the maps based on the score of the submaps, which is the sum of the scores contained within the submaps.
            return new Map(
             [...this.results.entries()].sort(
               (subMap1, subMap2) =>
                 this.getScoreForSubMap(subMap2[1]) - this.getScoreForSubMap(subMap1[1]),
             ),
           );
         }

         private transformMatches(
           matchesPerFile: Map<string, Matches<number>>,
         ): Map<string, Matches<Range>> {
           const results = new Map();
           matchesPerFile.forEach((subMap, matchedFileName) => {
             subMap.forEach((tupleArray, sourceFileName) => {
               let map = results.get(sourceFileName);
               const range = this.toRange(tupleArray);
               if (range.length !== 0) {
                 if (map === undefined) {
                   map = new Map();
                   results.set(matchedFileName, map);
                 }
                 map.set(sourceFileName, range);
               }
             });
           });
           return results;
         }


         private getScoreForArray(arr: Array<[Range, Range]>): number {
           return arr
             .map(rangeTuple => this.getScoreForRange(rangeTuple[0]))
             .reduce((acc, nextNumber) => acc + nextNumber);
         }

         private getScoreForSubMap(subMap: Matches<Range>): number {
           return [...subMap.values()]
             .flatMap(rangesArray => this.getScoreForArray(rangesArray))
             .reduce((acc, nextNumber) => acc + nextNumber);
         }

         /**
          * converts a list of matching lines to a list of ranges
          * @param matches the list of matching lines
          * @returns a list of tuples that contains two ranges, where the frist and second range correspond to the line
          * numbers of each file.
          */
         private toRange(matches: Array<[number, number]>): Array<[Range, Range]> {
           const ranges: Array<[Range, Range]> = new Array();

           // sort on first element of tuple and remove duplicates
           // TODO replace all of this with the following algorithm
           // keep a list of ranges, then for each location in in matches do:
           //  if one or both values fall in between a range, in account with the gapsize then extend those ranges
           //  else make a new range based on the value
           // when all values are done go over all the ranges and check if two or more can be joined
           // look for every place in the code where it is assumed that the both ranges in a rangesTuple are equal in
            // length and change appropriately
           matches = matches
             .sort((matchingLineNumbers1, matchingLineNumbers2) => {
               const tempResult = matchingLineNumbers1[0] - matchingLineNumbers2[0];
               return tempResult === 0
                 ? matchingLineNumbers1[1] - matchingLineNumbers2[1]
                 : tempResult;
             })
             .filter((item, pos, arr) => {
               return pos === 0 || !(item[0] === arr[pos - 1][0] && item[1] === arr[pos - 1][1]);
             });

           let last = matches.shift();
           if (last) {
             let currentRanges: [Range, Range] | undefined;
             while (matches.length !== 0) {
               const next = matches.shift();
               if (next) {
                 const [next1, next2] = next;
                 const [last1, last2] = last;
                 if (!currentRanges) {
                   currentRanges = [[last1, last1], [last2, last2]];
                 }
                 if (next1 - 1 === last1 && next2 - 1 === last2) {
                   currentRanges[0][1] += 1;
                   currentRanges[1][1] += 1;
                 } else {
                   ranges.push(currentRanges);
                   currentRanges = [[next1, next1], [next2, next2]];
                 }
                 last = next;
               }
             }
             if (currentRanges) {
               ranges.push(currentRanges);
             }
           }

           // remove all ranges that only contain one line
           return ranges.filter(
             rangesTuple => rangesTuple[0][1] - rangesTuple[0][0] + 1 >= this.minimumLines,
           );
         }
       }
