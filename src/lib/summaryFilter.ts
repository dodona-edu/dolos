import { Matches } from "./comparison";
import { RangesTuple } from "./summary";

export class SummaryFilter {
  /**
   * Removes all empty matching line array and empty matches maps when they occur.
   * @param matchesPerFile A filtered matchedPerFile map that might contain empty matching line array.
   * @returns A new map with all the empty values removes.
   */
  public static prune(matchesPerFile: Map<string, Matches<number>>): Map<string, Matches<number>> {
    const filteredMatchesPerFile: Array<[string, Matches<number>]> = [
      ...matchesPerFile.entries(),
    ].map(matchesEntry => {
      const matchedFileName: string = matchesEntry[0];
      let matches: Matches<number> = matchesEntry[1];
      matches = new Map(
        [...matches.entries()].filter(matchedEntry => {
          const [, matchingLines] = matchedEntry;
          return matchingLines.length !== 0;
        }),
      );
      return [matchedFileName, matches];
    });
    return new Map(
      filteredMatchesPerFile.filter(matchesEntry => {
        const [, matches] = matchesEntry;
        return matches.size > 0;
      }),
    );
  }
  /**
   * Filter the tuples pair based on the maches with the base file.
   * @param matchingLinesArray A matching line array between two files that you want to be filtered.
   * @param baseFileMatches1 The base file matches with the first file. The first elements of each tuples in this will
   * be used to filter the tuples based on the first element of each tuple in [[matchingLinesArray]].
   * @param baseFileMatches2 The same as [[baseFileMatches1]] but then for the second file. Here the first elements
   * in the tuples from this array will be used to filter the second element from the tuples from
   * [[matchingLinesArray]].
   */
  public static filterByBaseFile(
    matchingLinesArray: Array<[number, number]>,
    baseFileMatches1: Array<[number, number]>,
    baseFileMatches2: Array<[number, number]>,
  ): Array<[number, number]> {
    const baseFileMatchingLines1: number[] = baseFileMatches1.map(
      matchingLines => matchingLines[0],
    );
    const baseFileMatchingLines2: number[] = baseFileMatches2.map(
      matchingLines => matchingLines[0],
    );

    return matchingLinesArray.filter(
      matchingLines =>
        !(
          baseFileMatchingLines1.some(line => line === matchingLines[0]) ||
          baseFileMatchingLines2.some(line => line === matchingLines[1])
        ),
    );
  }

  /**
   * A function to check if a number tuple exists within an array.
   * @param list The list you ant to check.
   * @param item The item you want to know if it is contained within the list.
   */
  public static contains(list: Array<[number, number]>, item: [number, number]): boolean {
    return list.some(listItem => listItem[0] === item[0] && listItem[1] === item[1]);
  }

  /**
   * Makes a new list where all the double values where removed.
   * @param list The list you want all the non unique elements removed from.
   * @return A new list that only contains unique elements.
   */
  public static unique(list: Array<[number, number]>): Array<[number, number]> {
    const returnArray: Array<[number, number]> = new Array();
    list.forEach(value => {
      if (!this.contains(returnArray, value)) {
        returnArray.push(value);
      }
    });
    return returnArray;
  }

  public readonly minimumMaximumLines: number;
  public readonly minimumMinimumLines: number;
  public readonly maximumPassage: number;
  public readonly groupAmount: number | undefined;
  private readonly baseFileMatches: Map<string, Matches<number>>;
  /**
   * @param minimumMaximumLines The minimum amount of lines required by the longest range in a rangesTuple. If the
   * rangesTuple has less lines then it will be filtered out. When the rangesTuple has two ranges with a different
   * amount of lines, then the maximum between to two is used.
   * @param minimumMinimumLines The minimum amount of lines required by the shortest range in a rangesTuple.
   * @param maximumPassage Will be used by either filterByMaximumPassageCount as the maximum passageCount or in
   * filterByMaximumPassagePercentage as the percentage (between 0 and 1). It will be used as a percentage if
   * groupAmount is a value different from undefined.
   * @param baseFileMatches The matched per file resulting with from the comparison with the base file and all the
   * relevant files. This will usually be the result from
   * ```javascript
   *  const baseFileComparison = new Comparison(tokenizer);
   *  await baseFileComparison.addFile(program.base);
   *  baseFileMatches = await baseFileComparison.compareFiles(locations);
   * ```
   * or something similar. Note that you compare the base with all the other locations and not the other way around. If
   * this is not the case then the filtereing by basefile won't work as expected.
   * @param groupAmount The total amount of groups you are comparing, only use this when you want to use
   * [[filterByMaximumPassagePercentage]]. If this option is used then [[filterByMaximumPassagePercentage]] will be used
   * in filter instead of [[filterByMaximumPassageCount]].
   */
  constructor(
    minimumMaximumLines: number = 1,
    minimumMinimumLines: number = 1,
    maximumPassage: number = 0.9,
    baseFileMatches?: Map<string, Matches<number>>,
    groupAmount?: number,
  ) {
    this.minimumMaximumLines = minimumMaximumLines;
    this.minimumMinimumLines = minimumMinimumLines;
    this.maximumPassage = maximumPassage;
    this.baseFileMatches = baseFileMatches || new Map();
    this.groupAmount = groupAmount;
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
   * Filters out the passages that appear more than [[this.maximumPassage]].
   * @param matchesPerFile The matchesPerFile you want to filter.
   * @returns A filtered copy of the map.
   */
  public filterByMaximumPassageCount(
    matchesPerFile: Map<string, Matches<number>>,
  ): Map<string, Matches<number>> {
    return this.filterByPassagePredicate(matchesPerFile, value => value <= this.maximumPassage);
  }

  /**
   * Filters out the passages that appear in more then [[this.maximumPassage]]% of the files.
   * @param matchesPerFile The matchesPerFile you want to filter.
   * @returns A filtered copy of the map.
   */
  public filterByMaximumPassagePercentage(
    matchesPerFile: Map<string, Matches<number>>,
  ): Map<string, Matches<number>> {
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
   * Filters the given map if a line if that lines also matched with a basefile.
   * @param matchesPerFile The map you want to filter.
   * @returns A filtered copy of the map.
   */
  public filterByBaseFile(
    matchesPerFile: Map<string, Matches<number>>,
  ): Map<string, Matches<number>> {
    const filteredMatchesPerFile: Array<[string, Matches<number>]> = [
      ...matchesPerFile.entries(),
    ].map(entry => {
      const matchedFileName: string = entry[0];
      let matches: Map<string, Array<[number, number]>> = entry[1];
      matches = new Map(
        [...matches.entries()].map(matchesEntry =>
          this.filterMatchesEntryByBaseFile(matchedFileName, matchesEntry),
        ),
      );

      return [matchedFileName, matches];
    });

    return SummaryFilter.prune(new Map(filteredMatchesPerFile));
  }

  /**
   * Filters the given map. What filters are applied depends on the options given in the contructor of the summary
   * filter class.
   * @param matchesPerFile The matchesPerFile map you want to filter.
   * @return A filtered copy of the matchesPerFile.
   */
  public filter(matchesPerFile: Map<string, Matches<number>>): Map<string, Matches<number>> {
    let filteredMatchesPerFile: Map<string, Matches<number>>;
    if (this.groupAmount) {
      filteredMatchesPerFile = this.filterByMaximumPassagePercentage(matchesPerFile);
    } else {
      filteredMatchesPerFile = this.filterByMaximumPassageCount(matchesPerFile);
    }
    if (this.baseFileMatches.size > 0) {
      filteredMatchesPerFile = this.filterByBaseFile(filteredMatchesPerFile);
    }
    return filteredMatchesPerFile;
  }

  /**
   * Filters the [number, number] tuples in the entry when a line from the matched file if that line also matched with a line from a basefile.
   * @param matchedFileName The filename of the matched file.
   * @param matchesEntry The correspinding entry for the matched file.
   */
  private filterMatchesEntryByBaseFile(
    matchedFileName: string,
    matchesEntry: [string, Array<[number, number]>],
  ): [string, Array<[number, number]>] {
    const matchingFileName = matchesEntry[0];
    let matchedLines = matchesEntry[1];
    let matchedFileNameBaseLines: Array<[number, number]> = new Array();
    let matchingFileNameBaseLines: Array<[number, number]> = new Array();

    if (this.baseFileMatches.has(matchedFileName)) {
      const baseFileMatches: Matches<number> = this.baseFileMatches.get(matchedFileName) as Matches<
        number
      >;
      matchedFileNameBaseLines = this.concat(baseFileMatches.values());
      // It doesn't matter which basefile it has matched with, just that it did.
    }

    if (this.baseFileMatches.has(matchingFileName)) {
      const baseFileMatches: Matches<number> = this.baseFileMatches.get(
        matchingFileName,
      ) as Matches<number>;
      matchingFileNameBaseLines = this.concat(baseFileMatches.values());
      // It doesn't matter which basefile it has matched with, just that it did.
    }

    matchedLines = SummaryFilter.filterByBaseFile(
      matchedLines,
      matchedFileNameBaseLines,
      matchingFileNameBaseLines,
    );

    return [matchingFileName, matchedLines];
  }

  /**
   * Count the amount of times a line appears in a file, and do this for all the files in the map.
   * @param matchesPerFile The map where with all the files you want to count
   * @returns A map that maps the filename to another map that maps the line number to the amount that line occurred.
   */
  private countLineOccurrences(
    matchesPerFile: Map<string, Matches<number>>,
  ): Map<string, Map<number, number>> {
    const lineCountPerFile: Map<string, Map<number, number>> = new Map();

    matchesPerFile.forEach((matches, matchingFileName) => {
      matches.forEach((matchingLinesArray, matchedFileName) => {
        let matchesLinesCount: Map<number, number>;
        if (lineCountPerFile.has(matchingFileName)) {
          matchesLinesCount = lineCountPerFile.get(matchingFileName) as Map<number, number>;
        } else {
          matchesLinesCount = new Map();
          lineCountPerFile.set(matchingFileName, matchesLinesCount);
        }

        let matchedLinesCount: Map<number, number>;
        if (lineCountPerFile.has(matchedFileName)) {
          matchedLinesCount = lineCountPerFile.get(matchedFileName) as Map<number, number>;
        } else {
          matchedLinesCount = new Map();
          lineCountPerFile.set(matchedFileName, matchedLinesCount);
        }

        // When a line is encountered, add one to the line counter for that file. Only do this for unique
        // [number, number] tuples.
        SummaryFilter.unique(matchingLinesArray).forEach(matchingLines => {
          matchesLinesCount.set(
            matchingLines[0],
            (matchesLinesCount.get(matchingLines[0]) || 0) + 1,
          );
          matchedLinesCount.set(
            matchingLines[1],
            (matchedLinesCount.get(matchingLines[1]) || 0) + 1,
          );
        });
      });
    });
    return lineCountPerFile;
  }

  /**
   * A private function used to filter by passage count based on the output of a predicate.
   * @param matchesPerFile The matchedPerFile you want to filter.
   * @param predicate The predicate that is used to filter, will be given the passage count and must return a boolean.
   */
  private filterByPassagePredicate(
    matchesPerFile: Map<string, Matches<number>>,
    predicate: (value: number) => boolean,
  ): Map<string, Matches<number>> {
    const returnMap: Map<string, Matches<number>> = new Map();

    const lineCountPerFile: Map<string, Map<number, number>> = this.countLineOccurrences(
      matchesPerFile,
    );

    matchesPerFile.forEach((matches, matchingFileName) => {
      const filteredMatchingFileName: Matches<number> = new Map();
      const matchingFileNameLinesCount: Map<number, number> = lineCountPerFile.get(
        matchingFileName,
      ) as Map<number, number>;
      matches.forEach((matchingLinesArray, matchedFileName) => {
        const matchedFileNameLinesCount: Map<number, number> = lineCountPerFile.get(
          matchedFileName,
        ) as Map<number, number>;

        const filteredMatchingLinesArray = SummaryFilter.unique(matchingLinesArray).filter(
          matchingLines => {
            const matchingLineCount: number = matchingFileNameLinesCount.get(
              matchingLines[0],
            ) as number;
            const matchedLineCount: number = matchedFileNameLinesCount.get(
              matchingLines[1],
            ) as number;

            return predicate(matchingLineCount) && predicate(matchedLineCount);
          },
        );
        if (filteredMatchingLinesArray.length > 0) {
          filteredMatchingFileName.set(matchedFileName, filteredMatchingLinesArray);
        }
      });
      if (filteredMatchingFileName.size > 0) {
        returnMap.set(matchingFileName, filteredMatchingFileName);
      }
    });
    return returnMap;
  }

  /**
   * @param iterable The iterable that contains the array you want to concatenate.
   */
  private concat<T>(iterable: IterableIterator<T[]>): T[] {
    let returnArr: Array<T> = new Array();
    [...iterable].forEach(value => {
      returnArr = returnArr.concat(value);
    });
    return returnArr;
  }
}
