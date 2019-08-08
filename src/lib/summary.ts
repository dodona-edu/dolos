import fs from "fs";
import { next } from "nprime";
import { Matches } from "./comparison";

type Range = [number, number];
type RangesTuple = [Range, Range];
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
      subMap.forEach((rangesTupleArray, matchedFileName) => {
        let score = rangesTupleArray
          .map(rangesTuple => this.getLinesInRange(rangesTuple[0]))
          .reduce((accumulator, nextValue) => accumulator + nextValue);

        score = score / this.countLinesInFile(matchedFileName);

        console.log(`\tmatched file: ${matchedFileName}, score: ${Math.round(score * 100)}%`);
        console.log("\tranges: ");
        console.log(rangesTupleArray);
        console.log();
      });
    });
    if (this.results.size === 0) {
      console.log("There were no matches");
    }
  }

  /**
   * tests if the number is withing the given range. This function allows for gaps
   * as long as the gap is smaller than [[this.gapSize]]
   * @param value the number you want to test
   * @param range the range you want to test the number with
   */
  public isNumberWithingRange(value: number, range: Range): boolean {
    console.log(value);
    console.log(range);
    return true; // TODO
  }

  /**
   * Tests if the bounds of the ranges overlap. This function allows for gaps as long as
   * the gap is smaller or equal than [[this.gapSize]]
   * @param range1 the first range you want to test
   * @param range2 the second range you want to test
   */
  public doRangesOverlap(range1: Range, range2: Range): boolean {
    console.log(range1, range2); // TODO
    return false;
  }

  /**
   * compares the frist range from each tuple with each other and does the same with the second range in the tuples. Allows for a gap as long as it is
   * smaller than or equal to [[this.gapSize]]
   * @param rangesTuple1 the frist rangesTuple you want to compare
   * @param rangesTuple2 the second rangesTuple you want to compare
   */
  public doRangesTuplesOverlap(rangesTuple1: RangesTuple, rangesTuple2: RangesTuple): boolean {
    console.log(rangesTuple1, rangesTuple2);
    return false; // TODO
  }

  /**
   * extends the range with the given number. Allows for a gap as long as that gap is smaller or equal to [[this.gapSize]].
   * If the number is smaller or bigger than the lower, and upper bounds respectively then the corresponding bound is replaced. If the number is smaller than the upper
   * bound and bigger than the lower then the range does not change. The number cannot extend the range then undefined is returned.
   * @param value
   * @param range
   */
  public extendRangeWithNumber(value: number, range: Range): Range | undefined {
    console.log(value);
    return range; // TODO
  }

  /**
   * attempts to extend one range with the other. lllllllllllllllllllllllllllllllllllf it fails then it returns undefined.
   * @param range1 the first range you want to extend
   * @param range2 the second range you want to extend
   */
  public extendRangeWithRange(range1: Range, range2: Range): Range {
    console.log(range2);
    return range1; // TODO
  }

  /**
   * Attempts the extend the first element of each tuple with each other and tries the same for the second element. If this is not possible then undefined is returned.
   * @param rangesTuple1 the first rangesTuple you want to extend
   * @param rangesTuple2 the second rangesTuple you wan to extend
   */
  public extendRangesTupleWithRangesTuple(
    rangesTuple1: RangesTuple,
    rangesTuple2: RangesTuple,
  ): RangesTuple | undefined {
    console.log(rangesTuple2);
    return rangesTuple1; // TODO
  }

  /**
   * @param range the range you want the length of
   * @returns the amount of lines in the given range
   */
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

  /**
   * First sorts the array of rangesTuples, then the subMaps and finally the main maps according to their corresponding score functions.
   */
  private sortResults(): Map<string, Matches<Range>> {
    // TODO index the score of the ranges, arrays and submaps to make this more efficient.
    this.results.forEach((subMap, matchedFileName) => {
      subMap.forEach((rangeArray, _) => {
        // sorts the arrays based on the score of the ranges.
        rangeArray.sort(
          (rangesTuple1, rangesTuple2) =>
            this.getScoreForRange(rangesTuple2[0]) - this.getScoreForRangesTuple(rangesTuple1),
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

  /**
   * Transforms all the tuples to rangesTuples.
   * @param matchesPerFile A many-to-many comparison of a set of files. This map contains an entry for each of the
   * input files with the key being its file name and the value a list of matches. These matches are grouped
   * per matching file. The compareFiles function of the Comparison class can generate such mapping.
   */
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

  private getScoreForArray(arr: RangesTuple[]): number {
    return arr
      .map(rangesTuple => this.getScoreForRangesTuple(rangesTuple))
      .reduce((acc, nextNumber) => acc + nextNumber);
  }

  private getScoreForSubMap(subMap: Matches<Range>): number {
    return [...subMap.values()]
      .flatMap(rangesArray => this.getScoreForArray(rangesArray))
      .reduce((acc, nextNumber) => acc + nextNumber);
  }

  private getScoreForRangesTuple(rangesTuple: RangesTuple): number {
    return this.getScoreForRange(rangesTuple[0]) + this.getScoreForRange(rangesTuple[1]);
  }

  /**
   * converts a list of matching lines to a list of ranges
   * @param matches the list of matching lines
   * @returns a list of tuples that contains two ranges, where the frist and second range correspond to the line
   * numbers of each file.
   */
  private toRange(matches: Array<[number, number]>): RangesTuple[] {
    const ranges: RangesTuple[] = new Array();

    // TODO TEST THIS Code
    matches.forEach(next => {
      let rangesTuple: [Range | undefined, Range | undefined] = [undefined, undefined];
      let i = 0;
      while (i < ranges.length && (rangesTuple[0] !== undefined && rangesTuple[1] !== undefined)) {
        rangesTuple = [
          this.extendRangeWithNumber(next[0], ranges[i][0]), 
          this.extendRangeWithNumber(next[1], ranges[i][1])
        ];

        i += 1;
      }

      if (rangesTuple[0] === undefined || rangesTuple[1] === undefined) {
        ranges.push([[next[0], next[0]], [next[1], next[1]]]);
      } else {
        ranges[i] = rangesTuple as RangesTuple;
      }

      // if two rangesTuples overlap with each other then extend the second with the first and remove the
      // first from the array
      for (let i = ranges.length - 1; i >= 0; i--) {
        for (let j = i; j >= 0; j--) {
          if (i !== j) {
            const newRangesTuple = this.extendRangesTupleWithRangesTuple(ranges[i], ranges[j]);
            if (newRangesTuple) {
              ranges[j] = newRangesTuple;
            }
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
