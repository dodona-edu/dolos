import fs from "fs";
import { Matches } from "./comparison";
import { Range } from "./range"
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
    minimumLines: number = 2,
    gapSize: number = 1,
  ) {
    this.minimumLines = minimumLines;
    this.gapSize = gapSize;
    this.results = this.transformMatches(matchesPerFile);
    this.results = this.sortResults();
  }

  public toString(): string {
    let output: string = "";
    this.results.forEach((subMap, sourceFileName) => {
      output += `source: ${sourceFileName}\n\n`;
      const linesInSourceFile = this.countLinesInFile(sourceFileName);

      subMap.forEach((rangesTupleArray, matchedFileName) => {
        const score: number = rangesTupleArray
          .map(rangesTuple => this.getLinesInRange(rangesTuple[0]))
          .reduce((accumulator, nextValue) => accumulator + nextValue);

        const scoreMatchedFile = (score / this.countLinesInFile(matchedFileName)) * 100;
        const scoreSourceFile = (score / linesInSourceFile) * 100;

        output += `\tmatched file: ${matchedFileName}, score matched file: ${Math.round(
          scoreMatchedFile,
        )}%, score source file: ${Math.round(scoreSourceFile)}%\n\n`;

        output += "\tranges: ";
        output += rangesTupleArray.map(
          rangesTuple =>
            `[${this.rangeToString(rangesTuple[0])}, ${this.rangeToString(rangesTuple[1])}]`,
        );
        output += "\n\n";
      });
    });
    if (this.results.size === 0) {
      output += "There were no matches";
    }
    return output;
  }



  /**
   * Attempts the extend the first element of each tuple with each other and tries the same for the second element. If
   * this is not possible then undefined is returned.
   * @param rangesTuple1 the first rangesTuple you want to extend
   * @param rangesTuple2 the second rangesTuple you wan to extend
   */
  public extendRangesTupleWithRangesTuple(
    rangesTuple1: RangesTuple,
    rangesTuple2: RangesTuple,
  ): RangesTuple | undefined {
    const rangesTuple: [Range | undefined, Range | undefined] = [
      this.extendRangeWithRange(rangesTuple1[0], rangesTuple2[0]),
      this.extendRangeWithRange(rangesTuple1[1], rangesTuple2[1]),
    ];

    if (rangesTuple[0] === undefined || rangesTuple[1] === undefined) {
      return undefined;
    } else {
      return rangesTuple as RangesTuple;
    }
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
   * First sorts the array of rangesTuples, then the subMaps and finally the main maps according to their corresponding
   * score functions.
   */
  private sortResults(): Map<string, Matches<Range>> {
    // TODO index the score of the ranges, arrays and submaps to make this more efficient.
    this.results.forEach((matches, matchedFileName) => {
      matches.forEach((rangesTupleArray, _) => {
        // sorts the arrays based on the score of the ranges.
        rangesTupleArray.sort(
          (rangesTuple1, rangesTuple2) =>
            this.getScoreForRange(rangesTuple2[0]) - this.getScoreForRangesTuple(rangesTuple1),
        );
      });
      // sorts the submaps based on the score of the arrays, this is the sum of all the scores within the array.
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
   * converts a list of matching lines to a list of ranges
   * @param matches the list of matching lines
   * @returns a list of tuples that contains two ranges, where the frist and second range correspond to the line
   * numbers of each file.
   */
  private matchesToRange(matches: Array<[number, number]>): RangesTuple[] {
    const ranges: RangesTuple[] = new Array();

    matches.forEach(next => {
      let rangesTuple: [Range | undefined, Range | undefined] = [undefined, undefined];
      let i = -1;
      while (
        i < ranges.length - 1 &&
        (rangesTuple[0] === undefined || rangesTuple[1] === undefined)
      ) {
        i += 1;
        rangesTuple = [
          this.extendRangeWithNumber(next[0], ranges[i][0]),
          this.extendRangeWithNumber(next[1], ranges[i][1]),
        ];
      }

      if (rangesTuple[0] === undefined || rangesTuple[1] === undefined || i === ranges.length) {
        ranges.push([[next[0], next[0]], [next[1], next[1]]]);
      } else {
        ranges[i] = rangesTuple as RangesTuple;
      }
    });

    // if two rangesTuples overlap with each other then extend the second with the first and remove the
    // first from the array
    for (let i = ranges.length - 1; i >= 0; i--) {
      for (let j = i; j >= 0; j--) {
        if (i !== j) {
          const newRangesTuple = this.extendRangesTupleWithRangesTuple(ranges[i], ranges[j]);
          // console.log(ranges[i], ranges[j], newRangesTuple);
          if (newRangesTuple) {
            ranges[j] = newRangesTuple;
            ranges.splice(i, 1);
          }
          break;
        }
      }
    }

    // remove all ranges that only contain less the minimum required lines
    return ranges.filter(
      rangesTuple =>
        Math.max(this.getLinesInRange(rangesTuple[0]), this.getLinesInRange(rangesTuple[1])) >=
        this.minimumLines,
    );
  }
}
