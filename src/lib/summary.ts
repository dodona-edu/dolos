import fs from "fs";
import { Matches } from "./comparison";
import { Range } from "./range";
type RangesTuple = [Range, Range];
export class Summary {
  private readonly results: Map<string, Matches<Range>>;
  private readonly minimumLines: number;
  private readonly gapSize: number;

  /**
   * @param matches A many-to-many comparison of a set of files. This map contains an entry for each of the
   * input files with the key being its file name and the value a list of matches. These matches are grouped
   * per matching file. The compareFiles function of the Comparison class can generate such mapping.
   * @param minimumLines The minimum amount of lines required by a rangesTuple. If the rangesTuple has less lines then 
   * it will be filtered out. When the rangesTuple has two ranges with a different amount of lines, then the maximum
   * between to two is used.
   * @param gapSize The gap size allowed during the joining of two ranges. For example if the gap size is 0 then [1,3]
   * and [5,7] wont be joined, and if the gap size is one these will be joined into [1,7].
   */
  constructor(
    matchesPerFile: Map<string, Matches<number>>,
    minimumLines: number = 2,
    gapSize: number = 1,
  ) {
    this.minimumLines = minimumLines;
    this.gapSize = gapSize;
    this.results = this.transformMatches(matchesPerFile);
    this.results = this.sortResults();
  }

  public toString(): string {
    if (this.results.size === 0) {
       return "There were no matches";
    }

    return Array.from(this.results.entries()).map((resultEntry) => {
      let [sourceFileName, subMap] = resultEntry;
      let output = "";
      output += `source: ${sourceFileName}\n\n`;
      const linesInSourceFile = this.countLinesInFile(sourceFileName);

      output += Array.from(subMap.entries()).map((subMapEntry) => {
        let matchedFilenameOutput = "";
        let [matchedFileName, rangesTupleArray] = subMapEntry;
        const score: number = rangesTupleArray
          .map(rangesTuple => rangesTuple[0].getLineCount())
          .reduce((accumulator, nextValue) => accumulator + nextValue);

        const scoreMatchedFile = (score / this.countLinesInFile(matchedFileName)) * 100;
        const scoreSourceFile = (score / linesInSourceFile) * 100;

        matchedFilenameOutput += `\tmatched file: ${matchedFileName}, score matched file: ${Math.round(
          scoreMatchedFile,
        )}%, score source file: ${Math.round(scoreSourceFile)}%\n\n`;

        matchedFilenameOutput += "\tranges: ";
        matchedFilenameOutput += rangesTupleArray.map(rangesTuple => `[${rangesTuple[0]}, ${rangesTuple[1]}]`);
        matchedFilenameOutput += "\n\n";
        return matchedFilenameOutput;
      }).join('');
      return output
    }).join('');
  }

  /**
   * Checks pairwise if the first element of each RangesTuple can be extended with the second.
   * @param rangesTuple1 The tuple where the ranges will be tested if it can be extended from the ranges from the 
   * second tuple.
   * @param rangesTuple2 The tuple where the ranges will be used to extend with.
   */
  public canExtentRangesTupleWithRangesTuple(
    rangesTuple1: RangesTuple,
    rangesTuple2: RangesTuple,
  ): boolean {
    return (
      rangesTuple1[0].canExtendWithRange(rangesTuple2[0]) &&
      rangesTuple1[1].canExtendWithRange(rangesTuple2[1])
    );
  }

  /**
   * Attempts the extend the first element of each tuple with each other and tries the same for the second element.
   * Assumes that it is possible to perform this operation, an error is thrown if this is not the case.
   * @param rangesTuple1 The rangesTuple where the ranges will be extended.
   * @param rangesTuple2 The rangesTuple where the ranges will be used to extend.
   */
  public extendRangesTupleWithRangesTuple(rangesTuple1: RangesTuple, rangesTuple2: RangesTuple) {
    if (
      this.canExtentRangesTupleWithRangesTuple(rangesTuple1, rangesTuple2)
    ) {
      throw new RangeError("a value in the rangeTuple could not be extended");
    }

    rangesTuple1[0].extendWithRange(rangesTuple2[0]);
    rangesTuple1[1].extendWithRange(rangesTuple2[1]);
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
    return range.getLineCount();
  }

  /**
   * First sorts the array of rangesTuples, then the subMaps and finally the main maps according to their corresponding
   * score functions.
   */
  private sortResults(): Map<string, Matches<Range>> {
    // TODO index the score of the ranges, arrays and submaps to make this more efficient.
    this.results.forEach((matches, matchedFileName) => {
      matches.forEach((rangesTupleArray, _) => {
        // Sorts the arrays based on the score of the ranges.
        rangesTupleArray.sort(
          (rangesTuple1, rangesTuple2) =>
            this.getScoreForRange(rangesTuple2[0]) - this.getScoreForRangesTuple(rangesTuple1),
        );
      });
      // Sorts the submaps based on the score of the arrays, this is the sum of all the scores within the array.
      const tempMatches = new Map(
        [...matches.entries()].sort(
          (subMapEntry1, subMapEntry2) =>
            this.getScoreForArray(subMapEntry2[1]) - this.getScoreForArray(subMapEntry1[1]),
        ),
      );
      this.results.set(matchedFileName, tempMatches);
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
    const results: Map<string, Matches<Range>> = new Map();
    matchesPerFile.forEach((matches, matchedFileName) => {
      matches.forEach((matchLocations, matchingFile) => {
        let map: Matches<Range> | undefined = results.get(matchingFile);
        const rangesTupleArray: RangesTuple[] = this.matchesToRange(matchLocations);
        if (rangesTupleArray.length !== 0) {
          if (map === undefined) {
            map = new Map();
            results.set(matchedFileName, map);
          }
          map.set(matchingFile, rangesTupleArray);
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
      .map(rangesArray => this.getScoreForArray(rangesArray))
      .reduce((acc, nextNumber) => acc + nextNumber);
  }

  private getScoreForRangesTuple(rangesTuple: RangesTuple): number {
    return this.getScoreForRange(rangesTuple[0]) + this.getScoreForRange(rangesTuple[1]);
  }

  /**
   * Converts a list of matching lines to a list of ranges.
   * @param matches The list of matching lines.
   * @returns A list of tuples that contains two ranges, where the frist and second range correspond to the line
   * numbers of each file.
   */
  private matchesToRange(matches: Array<[number, number]>): RangesTuple[] {
    const ranges: RangesTuple[] = new Array();

    matches.forEach(next => {
      const rangeTupleIndex: number = ranges.findIndex(rangeTuple => {
        return (
          rangeTuple[0].canExtendWithNumber(next[0]) && rangeTuple[1].canExtendWithNumber(next[1])
        );
      });

      if (rangeTupleIndex === -1) {
        ranges.push([new Range(next[0], next[0], this.gapSize), new Range(next[1], next[1], this.gapSize)]);
      } else {
        ranges[rangeTupleIndex][0].extendWithNumber(next[0]);
        ranges[rangeTupleIndex][1].extendWithNumber(next[1]);
      }
    });

    // If two rangesTuples overlap with each other then extend the second with the first and remove the
    // first from the array.
    for (let i = ranges.length - 1; i >= 0; i--) {
      for (let j = i; j >= 0; j--) {
        if (i !== j) {
          // console.log(ranges[i], ranges[j], newRangesTuple);
          if (this.canExtentRangesTupleWithRangesTuple(ranges[i], ranges[j])) {
            this.extendRangesTupleWithRangesTuple(ranges[j], ranges[i]);
            ranges.splice(i, 1);
          }
          break;
        }
      }
    }

    // Remove all ranges that only contain less the minimum required lines.
    return ranges.filter(
      rangesTuple =>
        Math.max(rangesTuple[0].getLineCount(), rangesTuple[1].getLineCount()) >=
        this.minimumLines,
    );
  }
}
