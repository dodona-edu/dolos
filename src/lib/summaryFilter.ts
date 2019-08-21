import { Matches } from "./comparison";
import { Range } from "./range";
import { RangesTuple } from "./summary";

export class SummaryFilter {
  /**
   * Removes all empty matching line array and empty matches maps when they occur.
   * @param matchesPerFile A filtered matchedPerFile map that might contain empty matching line array.
   * @returns A new map with all the empty values removes.
   */
  public static prune<T>(matchesPerFile: Map<string, Matches<T>>): Map<string, Matches<T>> {
    const filteredMatchesPerFile: Array<[string, Matches<T>]> = [...matchesPerFile.entries()].map(
      matchesEntry => {
        const [matchedFileName, matches]: [string, Matches<T>] = matchesEntry;
        const filteredMatches: Matches<T> = new Map(
          [...matches.entries()].filter(matchedEntry => {
            const matchingLines: Array<[T, T]> = matchedEntry[1];
            return matchingLines.length !== 0;
          }),
        );
        return [matchedFileName, filteredMatches];
      },
    );
    return new Map(
      filteredMatchesPerFile.filter(matchesEntry => {
        const matches: Matches<T> = matchesEntry[1];
        return matches.size > 0;
      }),
    );
  }

  public readonly minimumMaximumLines: number;
  public readonly minimumMinimumLines: number;
  public readonly maximumPassage: number;
  public readonly groupAmount: number | undefined;
  public readonly outputAmount: number | undefined;
  /**
   * @param minimumMaximumLines The minimum amount of lines required by the longest range in a rangesTuple. If the
   * rangesTuple has less lines then it will be filtered out. When the rangesTuple has two ranges with a different
   * amount of lines, then the maximum between to two is used.
   * @param minimumMinimumLines The minimum amount of lines required by the shortest range in a rangesTuple.
   * @param maximumPassage Will be used by either filterByMaximumPassageCount as the maximum passageCount or in
   * filterByMaximumPassagePercentage as the percentage (between 0 and 1). It will be used as a percentage if
   * groupAmount is a value different from undefined.
   * @param groupAmount The total amount of groups you are comparing, only use this when you want to use
   * [[filterByMaximumPassagePercentage]]. If this option is used then [[filterByMaximumPassagePercentage]] will be used
   * in filter instead of [[filterByMaximumPassageCount]].
   */
  constructor(
    minimumMaximumLines: number = 1,
    minimumMinimumLines: number = 1,
    maximumPassage: number = 0.9,
    groupAmount?: number,
    outputAmount?: number,
  ) {
    this.minimumMaximumLines = minimumMaximumLines;
    this.minimumMinimumLines = minimumMinimumLines;
    this.maximumPassage = maximumPassage;
    this.groupAmount = groupAmount;
    this.outputAmount = outputAmount;
  }

  public filterOutputAmount(
    matchesPerFile: Map<string, Matches<Range>>,
  ): Map<string, Matches<Range>> {
    if (!this.outputAmount) {
      return matchesPerFile;
    }

    let outputCount = 0;
    const filteredMatchesPerFile: Map<string, Matches<Range>> = new Map();
    for (const [matchingFileName, matches] of matchesPerFile.entries()) {
      const filteredMatches: Matches<Range> = new Map();
      filteredMatchesPerFile.set(matchingFileName, filteredMatches);
      for (const [matchedFileName, rangesTuplesArray] of matches.entries()) {
        if (outputCount + rangesTuplesArray.length <= this.outputAmount) {
          filteredMatches.set(matchedFileName, rangesTuplesArray);
        } else {
          const elementsExtra: number = outputCount + rangesTuplesArray.length - this.outputAmount;
          filteredMatches.set(
            matchedFileName,
            rangesTuplesArray.slice(0, rangesTuplesArray.length - elementsExtra),
          );
        }
        outputCount += rangesTuplesArray.length;
      }
      if (this.outputAmount < outputCount) {
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
          this.minimumMaximumLines &&
        Math.min(rangesTuple[0].getLineCount(), rangesTuple[1].getLineCount()) >=
          this.minimumMinimumLines,
    );
  }

  /**
   * Filters out the passages that appear more than [[this.maximumPassage]] times.
   * @param matchesPerFile The matchesPerFile you want to filter.
   * @returns A filtered copy of the map.
   */
  public filterByMaximumPassageCount(
    matchesPerFile: Map<string, Matches<Range>>,
  ): Map<string, Matches<Range>> {
    return this.filterByPassagePredicate(matchesPerFile, value => value <= this.maximumPassage);
  }

  /**
   * Filters out the passages that appear in more then [[this.maximumPassage]]% of the files.
   * @param matchesPerFile The matchesPerFile you want to filter.
   * @returns A filtered copy of the map.
   */
  public filterByMaximumPassagePercentage(
    matchesPerFile: Map<string, Matches<Range>>,
  ): Map<string, Matches<Range>> {
    if (this.groupAmount === undefined) {
      throw new TypeError(
        "groupAmount cannot be undefined when using the filterByMaximumPassagePercentage function",
      );
    }
    return this.filterByPassagePredicate(
      matchesPerFile,
      value => value / (this.groupAmount as number) <= this.maximumPassage,
    );
  }

  /**
   * Filters the given map. Wether [[this.filterByMaximumPassagePercentage]] or [[this.filterByMaximumPassageCount]]
   * are applied depends on if [[this.groupAmount]] is given.
   * filter class.
   * @param matchesPerFile The matchesPerFile map you want to filter.
   * @return A filtered copy of the matchesPerFile.
   */
  public filterByMaximumPassage(
    matchesPerFile: Map<string, Matches<Range>>,
  ): Map<string, Matches<Range>> {
    if (this.groupAmount) {
      return this.filterByMaximumPassagePercentage(matchesPerFile);
    } else {
      return this.filterByMaximumPassageCount(matchesPerFile);
    }
  }

  /**
   * Count the amount of times a range appears in a file, and do this for all the files in the map.
   * @param matchesPerFile The map where with all the files you want to count
   * @returns A map that maps the filename to another map that maps the string returned by the toString method of range
   * to the amount that range occurred in that file.
   */
  private countRangeOccurrences(
    matchesPerFile: Map<string, Matches<Range>>,
  ): Map<string, Map<string, number>> {
    const rangeCountPerFile: Map<string, Map<string, number>> = new Map();
    // A string as a key to the second map is used because if an object is directly used as a key the the map
    // implementation will check if the references are equal, which we do not need as two different ranges objects can
    // be equal.

    matchesPerFile.forEach((matches, matchingFileName) => {
      matches.forEach((matchingLinesArray, matchedFileName) => {
        let matchesLinesCount: Map<string, number>;
        if (rangeCountPerFile.has(matchingFileName)) {
          matchesLinesCount = rangeCountPerFile.get(matchingFileName) as Map<string, number>;
        } else {
          matchesLinesCount = new Map();
          rangeCountPerFile.set(matchingFileName, matchesLinesCount);
        }

        let matchedLinesCount: Map<string, number>;
        if (rangeCountPerFile.has(matchedFileName)) {
          matchedLinesCount = rangeCountPerFile.get(matchedFileName) as Map<string, number>;
        } else {
          matchedLinesCount = new Map();
          rangeCountPerFile.set(matchedFileName, matchedLinesCount);
        }

        // When a range is encountered, add one to the range counter for that file.
        matchingLinesArray.forEach(matchingLines => {
          matchesLinesCount.set(
            matchingLines[0].toString(),
            (matchesLinesCount.get(matchingLines[0].toString()) || 0) + 1,
          );
          matchedLinesCount.set(
            matchingLines[1].toString(),
            (matchedLinesCount.get(matchingLines[1].toString()) || 0) + 1,
          );
        });
      });
    });
    return rangeCountPerFile;
  }

  /**
   * A private function used to filter by passage count based on the output of a predicate.
   * @param matchesPerFile The matchedPerFile you want to filter.
   * @param predicate The predicate that is used to filter, will be given the passage count and must return a boolean.
   */
  private filterByPassagePredicate(
    matchesPerFile: Map<string, Matches<Range>>,
    predicate: (value: number) => boolean,
  ): Map<string, Matches<Range>> {
    const rangeCountPerFile: Map<string, Map<string, number>> = this.countRangeOccurrences(
      matchesPerFile,
    );

    const returnMap: Map<string, Matches<Range>> = new Map(
      [...matchesPerFile.entries()].map(matchesPerFileEntry => {
        const [matchingFileName, matches]: [string, Matches<Range>] = matchesPerFileEntry;
        let filteredMatches: Matches<Range> = new Map();

        const matchingFileNameLinesCount: Map<string, number> = rangeCountPerFile.get(
          matchingFileName,
        ) as Map<string, number>;
        filteredMatches = new Map(
          [...matches.entries()].map(matchesEntry => {
            const [matchedFileName, matchingLinesArray]: [string, RangesTuple[]] = matchesEntry;

            const matchedFileNameLinesCount: Map<string, number> = rangeCountPerFile.get(
              matchedFileName,
            ) as Map<string, number>;

            const filteredMatchingLinesArray = matchingLinesArray.filter(matchingLines => {
              const matchingLineCount: number = matchingFileNameLinesCount.get(
                matchingLines[0].toString(),
              ) as number;
              const matchedLineCount: number = matchedFileNameLinesCount.get(
                matchingLines[1].toString(),
              ) as number;

              return predicate(matchingLineCount) && predicate(matchedLineCount);
            });
            return [matchedFileName, filteredMatchingLinesArray];
          }),
        );
        return [matchingFileName, filteredMatches];
      }),
    );

    return SummaryFilter.prune(returnMap);
  }
}
