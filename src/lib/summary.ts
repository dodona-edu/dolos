import fs from "fs";
import { Matches } from "./comparison";
import { Range } from "./range";
export type RangesTuple = [Range, Range];

/**
 * @param minimumLinesInLargestFragment The minimum amount of lines required by the largest code fragment. The default
 * is 1.
 * @param minimumLinesInSmallestFragment The minimum amount of lines required by the smallest code fragment. The default
 * is 0.
 * @param fragmentOutputLimit The maximum amount of code fragments that will appear in the output. Everything is shown
 * if it is anything other then a number greater then zero.
 */
export interface FilterOptions {
  fragmentOutputLimit?: number;
  minimumLinesInLargestFragment?: number;
  minimumLinesInSmallestFragment?: number;
}

export class Summary {
  public readonly gapSize: number;
  private readonly results: Map<string, Matches<Range>>;
  private readonly filterOptions: FilterOptions;

  private readonly defaultFilterOptions: FilterOptions = {
    fragmentOutputLimit: undefined,
    minimumLinesInLargestFragment: 1,
    minimumLinesInSmallestFragment: 0,
  };

  /**
   * Generates a summary for the given matches.
   * @param matchesPerFile A many-to-many comparison of a set of files. This map contains an entry for each of the
   * input files with the key being its file name and the value a list of matches. These matches are grouped
   * per matching file. The compareFiles function of the Comparison class can generate such mapping.
   * @param gapSize The gap size allowed during the joining of two ranges. For example if the gap size is 0 then [1,3]
   * and [5,7] wont be joined, and if the gap size is one these will be joined into [1,7].
   * @param filterOptions The options used to filter the output, for a more detailed explanation see [[FilterOptions]].
   */
  constructor(
    matchesPerFile: Map<string, Matches<number>>,
    gapSize: number = 0,
    filterOptions?: FilterOptions,
  ) {
    this.gapSize = gapSize;
    this.filterOptions = filterOptions || this.defaultFilterOptions;
    this.results = this.transformMatches(matchesPerFile);
    this.results = this.filterOutputAmount(this.results);
    this.results = this.sortResults();
  }

  public filterOutputAmount(
    matchesPerFile: Map<string, Matches<Range>>,
  ): Map<string, Matches<Range>> {
    if (
      !this.filterOptions ||
      !this.filterOptions.fragmentOutputLimit ||
      this.filterOptions.fragmentOutputLimit <= 0
    ) {
      return matchesPerFile;
    }

    let outputCount = 0;
    const filteredMatchesPerFile: Map<string, Matches<Range>> = new Map();
    for (const [matchingFileName, matches] of matchesPerFile.entries()) {
      const filteredMatches: Matches<Range> = new Map();
      filteredMatchesPerFile.set(matchingFileName, filteredMatches);
      for (const [matchedFileName, rangesTuplesArray] of matches.entries()) {
        if (outputCount + rangesTuplesArray.length <= this.filterOptions.fragmentOutputLimit) {
          filteredMatches.set(matchedFileName, rangesTuplesArray);
        } else {
          const elementsExtra: number =
            outputCount + rangesTuplesArray.length - this.filterOptions.fragmentOutputLimit;
          filteredMatches.set(
            matchedFileName,
            rangesTuplesArray.slice(0, rangesTuplesArray.length - elementsExtra),
          );
        }
        outputCount += rangesTuplesArray.length;
      }
      if (this.filterOptions.fragmentOutputLimit < outputCount) {
        break;
      }
    }
    return filteredMatchesPerFile;
  }

  /**
   * Remove all ranges that only contain less the minimum required lines. Returns a filtered copy of the array.
   * @param rangesTupleArray The rangesTupleArray you want filter.
   */
  public filterByMinimumLines(rangesTupleArray: RangesTuple[]): RangesTuple[] {
    return rangesTupleArray.filter(
      rangesTuple =>
        Math.max(rangesTuple[0].getLineCount(), rangesTuple[1].getLineCount()) >=
          (this.filterOptions.minimumLinesInLargestFragment || 0) &&
        Math.min(rangesTuple[0].getLineCount(), rangesTuple[1].getLineCount()) >=
          (this.filterOptions.minimumLinesInSmallestFragment || 0),
    );
  }
  /**
   * @param comment A command you want to add to the summary.
   */
  public toString(comment?: string): string {
    if (this.results.size === 0) {
      return "There were no matches";
    }

    let output = "";
    if (comment !== undefined) {
      output += comment + "\n";
    }

    const linesInFileMap: Map<string, number> = new Map();

    output += Array.from(this.results.entries())
      .map(resultEntry => {
        const [sourceFileName, subMap] = resultEntry;
        let subOutput = "";
        subOutput += `source: ${sourceFileName}\n\n`;
        const linesInSourceFile = this.countLinesInFile(sourceFileName);

        const entryArray: Array<[string, RangesTuple[]]> = Array.from(subMap.entries());

        subOutput += entryArray
          .map(subMapEntry => {
            let matchedFilenameOutput = "";
            const [matchedFileName, rangesTupleArray] = subMapEntry;
            const score: number = rangesTupleArray
              .map(rangesTuple => rangesTuple[0].getLineCount())
              .reduce((accumulator, nextValue) => accumulator + nextValue);

            if (!linesInFileMap.has(matchedFileName)) {
              linesInFileMap.set(matchedFileName, this.countLinesInFile(matchedFileName));
            }
            const scoreMatchedFile =
              (score / (linesInFileMap.get(matchedFileName) as number)) * 100;
            const scoreSourceFile = (score / linesInSourceFile) * 100;

            matchedFilenameOutput += `\tmatched file: ${matchedFileName}, score matched file: ${Math.round(
              scoreMatchedFile,
            )}%, score source file: ${Math.round(scoreSourceFile)}%\n\n`;

            matchedFilenameOutput += "\tranges: [\n";
            matchedFilenameOutput += rangesTupleArray
              .map(rangesTuple => "\t " + this.rangesTupleToString(rangesTuple))
              .join("\n");
            matchedFilenameOutput += "\n\t]\n\n";
            return matchedFilenameOutput;
          })
          .join("");
        return subOutput;
      })
      .join("");
    return output;
  }

  /**
   * @param rangesTuple The tuple you want a string representation of.
   * @returns A string representation of the rangesTuple.
   */
  public rangesTupleToString(rangesTuple: RangesTuple): string {
    return `[${rangesTuple[0].toString()}, ${rangesTuple[1].toString()}]`;
  }

  /**
   * Checks pairwise if the first element of each RangesTuple can be extended with the second.
   * @param rangesTuple1 The tuple where the ranges will be tested if it can be extended from the ranges from the
   * second tuple.
   * @param rangesTuple2 The tuple where the ranges will be used to extend with.
   */
  public canExtendRangesTupleWithRangesTuple(
    rangesTuple1: RangesTuple,
    rangesTuple2: RangesTuple,
  ): boolean {
    return (
      rangesTuple1[0].canExtendWithRange(rangesTuple2[0], this.gapSize) &&
      rangesTuple1[1].canExtendWithRange(rangesTuple2[1], this.gapSize)
    );
  }

  /**
   * Attempts the extend the first element of each tuple with each other and tries the same for the second element.
   * Assumes that it is possible to perform this operation, an error is thrown if this is not the case.
   * @param rangesTuple1 The rangesTuple where the ranges will be extended.
   * @param rangesTuple2 The rangesTuple where the ranges will be used to extend.
   */
  public extendRangesTupleWithRangesTuple(rangesTuple1: RangesTuple, rangesTuple2: RangesTuple) {
    if (!this.canExtendRangesTupleWithRangesTuple(rangesTuple1, rangesTuple2)) {
      throw new RangeError("a value in the rangeTuple could not be extended");
    }

    rangesTuple1[0].extendWithRange(rangesTuple2[0]);
    rangesTuple1[1].extendWithRange(rangesTuple2[1]);
  }

  /**
   * Converts a list of matching lines to a list of ranges.
   * @param matches The list of matching lines.
   * @returns A list of tuples that contains two ranges, where the frist and second range correspond to the line
   * numbers of each file.
   */
  public matchesToRange(matches: Array<[number, number]>): RangesTuple[] {
    let ranges: RangesTuple[] = new Array();

    matches.forEach(next => {
      const rangeTuple: RangesTuple | undefined = ranges.find(lambdaRangeTuple => {
        return (
          lambdaRangeTuple[0].canExtendWithNumber(next[0], this.gapSize) &&
          lambdaRangeTuple[1].canExtendWithNumber(next[1], this.gapSize)
        );
      });
      if (rangeTuple === undefined) {
        ranges.push([new Range(next[0], next[0]), new Range(next[1], next[1])]);
      } else {
        rangeTuple[0].extendWithNumber(next[0]);
        rangeTuple[1].extendWithNumber(next[1]);
      }
    });

    ranges = this.concatenateRanges(ranges);

    return this.filterByMinimumLines(ranges);
  }

  /**
   * Concatenates all the rangesTuples whenever possible.
   * @param rangesTupleArray The rangesTuples you want to concatenate where possible. Returns a new array with the
   * result.
   */
  public concatenateRanges(rangesTupleArray: RangesTuple[]): RangesTuple[] {
    const ranges: RangesTuple[] = rangesTupleArray.slice();
    // If two rangesTuples overlap with each other then extend the second with the first and remove the
    // first from the array.
    for (let i = ranges.length - 1; i >= 0; i--) {
      for (let j = i - 1; j >= 0; j--) {
        if (this.canExtendRangesTupleWithRangesTuple(ranges[i], ranges[j])) {
          this.extendRangesTupleWithRangesTuple(ranges[j], ranges[i]);
          ranges.splice(i, 1);
          break;
        }
      }
    }
    return ranges;
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
    matchesPerFile.forEach((matches, matchedFile) => {
      matches.forEach((matchLocations, matchingFile) => {
        let map: Matches<Range> | undefined = results.get(matchedFile);
        const rangesTupleArray: RangesTuple[] = this.matchesToRange(matchLocations);
        if (rangesTupleArray.length !== 0) {
          if (map === undefined) {
            map = new Map();
            results.set(matchedFile, map);
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
}
