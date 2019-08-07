import fs from "fs";
import { Matches } from "./comparison";

type Range = [number, number];
type RangeTuple = [Range, Range];
export class Summary {
  private readonly results: Map<string, Matches<Range>>;
  private readonly minimumLines: number;
  private readonly gapSize: number;

  /**
   * @param matches A many-to-many comparison of a set of files. This map contains an entry for each of the
   * input files with the key being its file name and the value a list of matches. These matches are grouped
   * per matching file. The compareFiles function of the Comparison class can generate such mapping.
   */
  constructor(
    matchesPerFile: Map<string, Matches<number>>,
    minimumLines: number = 1,
    gapSize: number = 1,
  ) {
    this.results = this.transformMatches(matchesPerFile);
    this.results = this.sortResults();
    this.minimumLines = minimumLines;
    this.gapSize = gapSize;
  }

  // TODO return a string and rename this function to 'toString';
  public printSummary(): void {
    this.results.forEach((subMap, sourceFileName) => {
      console.log(`source: ${sourceFileName}`);
      console.log();
      subMap.forEach((rangeTupleArray, matchedFileName) => {
        let score = rangeTupleArray
          .map(rangesTuple => this.getLinesInRange(rangesTuple[0]))
          .reduce((accumulator, nextValue) => accumulator + nextValue);

        score = score / this.countLinesInFile(matchedFileName);

        console.log(`\tmatched file: ${matchedFileName}, score: ${Math.round(score * 100)}%`);
        console.log("\tranges: ");
        console.log(rangeTupleArray);
        console.log();
      });
    });
    if (this.results.size === 0) {
      console.log("There were no matches");
    }
  }

  public isNumberWithingRange(value: number, range: Range): boolean {
    console.log(value);
    console.log(range);
    return true; // TODO
  }

  public doRangesOverlap(range1: Range, range2: Range): boolean {
    console.log(range1, range2); // TODO
    return false;
  }

  public doRangeTuplesOverlap(rangeTuple1: RangeTuple, rangeTuple2: RangeTuple): boolean {
    console.log(rangeTuple1, rangeTuple2);
    return false; // TODO
  }

  public extendRangeWithNumber(value: number, range: Range): Range {
    console.log(value);
    return range; // TODO
  }

  public extendRangeWithRange(range1: Range, range2: Range): Range {
    console.log(range2);
    return range1; // TODO
  }

  public extendRangeTupleWithRangeTuple(
    rangeTuple1: RangeTuple,
    rangeTuple2: RangeTuple,
  ): RangeTuple {
    console.log(rangeTuple2);
    return rangeTuple1; // TODO
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
            this.getScoreForRange(rangeTuple2[0]) - this.getScoreForRangeTuple(rangeTuple1),
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
      .map(rangeTuple => this.getScoreForRangeTuple(rangeTuple))
      .reduce((acc, nextNumber) => acc + nextNumber);
  }

  private getScoreForSubMap(subMap: Matches<Range>): number {
    return [...subMap.values()]
      .flatMap(rangesArray => this.getScoreForArray(rangesArray))
      .reduce((acc, nextNumber) => acc + nextNumber);
  }

  private getScoreForRangeTuple(rangeTuple: RangeTuple): number {
    return this.getScoreForRange(rangeTuple[0]) + this.getScoreForRange(rangeTuple[1]);
  }

  /**
   * converts a list of matching lines to a list of ranges
   * @param matches the list of matching lines
   * @returns a list of tuples that contains two ranges, where the frist and second range correspond to the line
   * numbers of each file.
   */
  private toRange(matches: Array<[number, number]>): Array<[Range, Range]> {
    const ranges: Array<[Range, Range]> = new Array();
    // TODO TEST THIS Code

    // sort on first element of tuple and remove duplicates
    // TODO replace all of this with the following algorithm
    // look for every place in the code where it is assumed that the both ranges in a rangesTuple are equal in
    // length and change appropriately

    matches.forEach(next => {
      const rangeTupleIndex: number = ranges.findIndex(rangeTuple => {
        return (
          this.isNumberWithingRange(next[0], rangeTuple[0]) &&
          this.isNumberWithingRange(next[1], rangeTuple[1])
        );
      });

      if (rangeTupleIndex === -1) {
        ranges.push([[next[0], next[0]], [next[1], next[1]]]);
      } else {
        const rangeTuple = ranges[rangeTupleIndex];
        ranges[rangeTupleIndex] = [
          this.extendRangeWithNumber(next[0], rangeTuple[0]),
          this.extendRangeWithNumber(next[1], rangeTuple[1]),
        ];
      }

      // if two rangesTuples overlap with each other then extend the second with the first and remove the
      // first from the array
      for (let i = ranges.length - 1; i >= 0; i--) {
        for (let j = i; j >= 0; j--) {
          if (i !== j && this.doRangeTuplesOverlap(ranges[i], ranges[j])) {
            ranges[j] = this.extendRangeTupleWithRangeTuple(ranges[i], ranges[j]);
            ranges.splice(i, 1);
            break;
          }
        }
      }
    });

    // remove all ranges that only contain less the minimum required lines
    return ranges.filter(
      rangesTuple =>
        Math.max(this.getLinesInRange(rangesTuple[0]), this.getLinesInRange(rangesTuple[1])) >=
        this.minimumLines,
    );
  }
}
