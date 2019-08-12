import { Matches } from "./comparison";
import { RangesTuple } from "./summary";

export class SummaryFilter {
  public readonly minimumMaximumLines: number;
  public readonly minimumMinimumLines: number;
  public readonly maximumPassagePercentage: number;
  constructor(
    minimumMaximumLines: number = 1,
    minimumMinimumLines: number = 1,
    maximumPassagePercentage: number = 10,
  ) {
    this.minimumMaximumLines = minimumMaximumLines;
    this.minimumMinimumLines = minimumMinimumLines;
    this.maximumPassagePercentage = maximumPassagePercentage;
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
  // TODO test
  public filterByMaximumPassagePercentage(
    matchesPerFile: Map<string, Matches<number>>,
    groupAmount: number,
  ): Map<string, Matches<number>> {
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

    const returnMap: Map<string, Matches<number>> = new Map();

    matchesPerFile.forEach((matches, matchingFileName) => {
      const filteredMatchingFileName: Map<string, Array<[number, number]>> = new Map();
      const matchingFileNameLinesCount: Map<number, number> = lineCountPerFile.get(
        matchingFileName,
      ) as Map<number, number>;
      matches.forEach((matchingLinesArray, matchedFileName) => {

        const matchedFileNameLinesCount: Map<number, number> = lineCountPerFile.get(
          matchedFileName,
        ) as Map<number, number>;

        const filteredMatchingLinesArray = SummaryFilter.unique(matchingLinesArray).filter((matchingLines) => {

          const matchingLineCount: number = matchingFileNameLinesCount.get(matchingLines[0]) as number;
          const matchedLineCount: number = matchedFileNameLinesCount.get( matchingLines[1]) as number;

          return (
            matchingLineCount / groupAmount <= this.maximumPassagePercentage &&
            matchedLineCount / groupAmount <= this.maximumPassagePercentage
          );
        });
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

  //TODO test
  public static filterByBaseFile(
    matchingLinesArray: Array<[number, number]>,
    baseFileMatches: RangesTuple[],
  ): Array<[number, number]> {
    const matchedFileRangesArray = baseFileMatches.map(rangesTuple => rangesTuple[1]);
    // it is assumed that the order of the tuples withing basefileMatches is: [range corresponding with the basefile, range corresponding with the matched file]
    // the first element in each number tuple will be assumed to belong to the matched file you want to filter
    return matchingLinesArray.filter(
      matchingLines =>
        !matchedFileRangesArray.some(range => range.isNumberWithingBounds(matchingLines[0])),
    );
  }

  public static contains(list: Array<[number, number]>, item: [number, number]): boolean {
    return list.some(listItem => listItem[0] === item[0] && listItem[1] === item[1]);
  }

  public static unique(list: Array<[number, number]>): Array<[number, number]> {
    const returnArray: Array<[number, number]> = new Array();
    list.forEach(value => {
      if (!this.contains(returnArray, value)) {
        returnArray.push(value);
      }
    });
    return returnArray;
  }
}
