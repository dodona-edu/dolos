import fs from "fs";
import { Matches } from "./comparison";

type Range = [number, number];
export class Summary {
  private results: Map<string, Matches<Range>>;
  private minimumLines = 1;

  /**
   * @param matches A map of a filename to another map. This map uses the name of the sourcefile which matched with
   * the first filename. The value of this submap contains an array with tuple which contains the maching lines
   * in each file. This can be generated with the compareFiles method of the Comparison class.
   */
  constructor(matches: Map<string, Matches<number>>) {
    this.results = this.transformMatches(matches);
    this.sortResults();
  }

  // TODO compute score based on the fraction of matched lines over the total number of lines
  public printSummary(): void {
    this.results.forEach((subMap, sourceFileName) => {
      console.log(`source: ${sourceFileName}`);
      console.log();
      subMap.forEach((rangeTupleArray, matchedFileName) => {
        let score = rangeTupleArray
          .map(rangesTuple => this.getLinesInRange(rangesTuple[0]))
          .reduce((accumulator, nextValue) => accumulator + nextValue);
        
        console.log(score);
        score = score / this.countLinesInFile(matchedFileName);

        console.log(`\tmatched file: ${matchedFileName}, score: ${Math.round(score)}%`);
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
  private getScore(range: Range): number {
    return range[1] - range[0] + 1;
  }

  private sortResults() {
    // TODO index the score of the ranges, arrays and submaps to make this more efficient.
    this.results.forEach((subMap, matchedFileName) => {
      subMap.forEach((rangeArray, _) => {
        // sorts the arrays based on the score of the ranges.
        rangeArray.sort(
          (rangeTuple1, rangeTuple2) =>
            this.getScore(rangeTuple2[0]) - this.getScore(rangeTuple1[0]),
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
    this.results = new Map(
      [...this.results.entries()].sort(
        (subMap1, subMap2) =>
          this.getScoreForSubMap(subMap2[1]) - this.getScoreForSubMap(subMap1[1]),
      ),
    );
  }

  private transformMatches(matches: Map<string, Matches<number>>): Map<string, Matches<Range>> {
    const results = new Map();
    matches.forEach((subMap, matchedFileName) => {
      subMap.forEach((tupleArray, sourceFileName) => {
        let map = results.get(sourceFileName);
        const range = this.toRange(tupleArray);
        if (range.length !== 0) {
          if (map === undefined) {
            map = new Map();
            results.set(sourceFileName, map);
          }
          map.set(matchedFileName, this.toRange(tupleArray));
        }
      });
    });
    return results;
  }

  // private getScoreForFile(file: string,values: Array<[Range, Range]>): number {

  // }

  private getScoreForArray(arr: Array<[Range, Range]>): number {
    return arr.map(rangeTuple => this.getScore(rangeTuple[0])).reduce((acc, prev) => acc + prev);
  }

  // TODO this is plain wrong
  private getScoreForSubMap(subMap: Matches<Range>): number {
    return [...subMap.values()]
      .flatMap(ranges => ranges.map(rangeTuple => rangeTuple[0]))
      .map(range => this.getScore(range))
      .reduce((acc, prev) => acc + prev);
  }

  /**
   * converts a list of matching lines to a list of ranges
   * @param matches the list of matching lines
   * @returns a list of tuples that contains two ranges, where the frist and second range correspond to the line
   * numbers of each file.
   */
  private toRange(matches: Array<[number, number]>): Array<[Range, Range]> {
    const ranges: Array<[[number, number], [number, number]]> = new Array();

    // sort on first element of tuple and remove duplicates
    matches = matches
      .sort((matchingLineNumbers1, matchingLineNumbers2) => {
        const tempResult = matchingLineNumbers1[0] - matchingLineNumbers2[0];
        return tempResult === 0 ? matchingLineNumbers1[1] - matchingLineNumbers2[1] : tempResult;
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
