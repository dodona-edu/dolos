import { Matches } from "./comparison";
import File from "./files/file";
import FileGroup from "./files/fileGroup";
import { HTMLSummaryFormatter } from "./formatters/htmlSummaryFormatter";
import { JSONFormatter } from "./formatters/jsonFormatter";
import { Options } from "./options";
import { Range } from "./range";
import { Clustered, Match, RangesTuple } from "./utils";
import * as Utils from "./utils";

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
  minimumFragmentLength?: number;
}

export class Summary {
  private static readonly htmlFormatter: HTMLSummaryFormatter = new HTMLSummaryFormatter();

  public readonly results: Map<FileGroup, Matches<Range>>;
  private readonly minimumFragmentLength: number;
  private readonly gapSize: number;
  private readonly maxMatches: number | null;
  private readonly clusteredResults: Clustered<Match>;
  private readonly clusterCutOffValue: number;

  /**
   * Generates a summary for the given matches.
   * @param matchesPerFile A many-to-many comparison of a set of files. This map contains an entry for each of the
   * input files with the key being its file name and the value a list of matches. These matches are grouped
   * per matching file. The compareFiles function of the Comparison class can generate such mapping.
   * @param gapSize The gap size allowed during the joining of two ranges. For example if the gap size is 0 then [1,3]
   * and [5,7] wont be joined, and if the gap size is one these will be joined into [1,7].
   * @param filterOptions The options used to filter the output, for a more detailed explanation see [[FilterOptions]].
   * @param clusterCutOffValue The minimum amount of lines required in order for two files to be clustered together.
   */
  constructor(
    matchesPerFile: Map<FileGroup, Matches<number>>,
    options: Options,
  ) {
    this.clusterCutOffValue = options.clusterMinMatches;
    this.gapSize = options.maxGapSize;
    this.maxMatches = options.maxMatches;
    this.minimumFragmentLength = options.minFragmentLength;
    this.results = this.transformMatches(matchesPerFile);
    this.results = this.filterOutputAmount(this.results);
    Object.freeze(this.results);
    this.clusteredResults = this.clusterResults(this.results);
    Object.freeze(this.clusteredResults);
  }

  /**
   * Limits the amount of RangesTuples in the results.
   * @param matchesPerFile The results you want to filter.
   */
  public filterOutputAmount(
    matchesPerFile: Map<FileGroup, Matches<Range>>,
  ): Map<FileGroup, Matches<Range>> {

    if (!this.maxMatches) {
      return matchesPerFile;
    }

    let matchesPerFileScoreArray: Array<[File, File, RangesTuple[], number]> = new Array();
    for (const [matchedFile, matches] of matchesPerFile.entries()) {
      for (const [matchingFile, rangesTupleArray] of matches.entries()) {
        matchesPerFileScoreArray.push([
          matchingFile,
          matchedFile.files[0], // TODO again, this assuses the first file matches
          rangesTupleArray,
          this.getScoreForArray(rangesTupleArray),
        ]);
      }
    }
    // Sort the matchesPerFileScoreArray so only the largest arrays are kept.
    matchesPerFileScoreArray.sort(
      ([, , , matchScore1], [, , , matchScore2]) => matchScore2 - matchScore1,
    );

    matchesPerFileScoreArray = matchesPerFileScoreArray.slice(
      0,
      this.maxMatches,
    );

    const filteredMatchesPerGroup: Map<FileGroup, Matches<Range>> = new Map();
    for (const [matchedFile, matchingFile, rangesTupleArray] of matchesPerFileScoreArray) {
      let matches: Matches<Range> | undefined = filteredMatchesPerGroup.get(matchedFile.group);
      if (!matches) {
        matches = new Map();
        filteredMatchesPerGroup.set(matchedFile.group, matches);
      }

      matches.set(matchingFile, rangesTupleArray);
    }

    return filteredMatchesPerGroup;
  }

  /**
   * Remove all ranges that only contain less the minimum required lines. Returns a filtered copy of the array.
   * @param rangesTupleArray The rangesTupleArray you want filter.
   */
  public filterByMinimumLines(rangesTupleArray: RangesTuple[]): RangesTuple[] {
    return rangesTupleArray.filter(
      rangesTuple =>
        Math.min(rangesTuple[0].getLineCount(), rangesTuple[1].getLineCount()) >=
        this.minimumFragmentLength,
    );
  }

  /**
   * Generates a JSON representation of this summary.
   * @param comment A string you want to add to the report.
   * @param options The options used to generate the report.
   */
  public toJSON(options?: Options): string {
    return JSONFormatter.format(this.clusteredResults, options);
  }

  /**
   * Generates a html representation of this summary.
   * @param comment A comment you want to add to the report.
   * @param options The options that were used to generate this report.
   */
  public toHTML(options?: Options): string {
    return Summary.htmlFormatter.format(this.toJSON(options));
  }
  /**
   * Returns the maximum from the tuples returned from [[this.countLinesInRanges]].
   * @param rangesTupleArray The rangesTupleArray you want the maximum line count of.
   */
  public getMaxMatchingLineCount(rangesTupleArray: RangesTuple[]): number {
    return Math.max(...Utils.countLinesInRanges(rangesTupleArray));
  }

  public toString(
    options?: Options,
    consoleColours: boolean = false,
  ): string {
    if (this.clusteredResults.length === 0) {
      return "There were no matches";
    }

    let output = "";
    if (options && options.comment !== null) {
      output += options.comment + "\n";
    }
    if (options) {
      output += `Options: ${options}\n`;
    }

    for (let index = 0; index < this.clusteredResults.length; index += 1) {
      let clusterNameString = `Cluster ${index + 1}\n`;
      if (consoleColours) {
        clusterNameString = Utils.colour("red", clusterNameString);
      }
      output += clusterNameString;
      output += this.groupToString(this.clusteredResults[index], consoleColours).replace(
        "\n",
        "\t\n",
      );
      output += "\n";
    }

    return output;
  }

  public groupToString(group: Match[], consoleColours: boolean): string {
    return (
      group.map(groupEntry => this.groupEntryToString(groupEntry, consoleColours)).join("\n") + "\n"
    );
  }
  public groupEntryToString(
    [matchedFile, matchingFile, matches]: [File, File, RangesTuple[]],
    consoleColours: boolean,
  ): string {
    matches.sort(([r1], [r2]) => r1.from - r2.from);
    const matchesString: string = matches
      .map(match => JSON.stringify(match, JSONFormatter.JSONReplacerFunction))
      .join("\n\t\t");

    const [scoreMatchedFile, scoreMatchingFile] = Utils.scoreForFiles(
      matches,
      matchedFile,
      matchingFile,
    );

    let returnString: string = `\t${matchedFile}(${scoreMatchedFile}%) + ${matchingFile}(${scoreMatchingFile}%) => \n`;
    if (consoleColours) {
      returnString = Utils.colour("green", returnString);
    }

    return `${returnString}\t\t${matchesString}`;
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

  /**
   * Clusters the results based on [[this.clusterCutOffValue]].
   * @param results The results you want to cluster.
   */
  public clusterResults(results: Map<FileGroup, Matches<Range>>): Clustered<Match> {
    const groupsSet: Set<FileGroup> = new Set();
    const fileTupleScores: Array<[File, File, RangesTuple[], number]> = new Array();

    // Maps the results to tuples containing the two files, the matches between those two files and a score for that
    // File pair. Also fills the file set.
    for (const [matchedGroup, matches] of results.entries()) {
      groupsSet.add(matchedGroup);
      for (const [matchingFile, matchingRanges] of matches.entries()) {
        groupsSet.add(matchingFile.group);
        const score = this.getMaxMatchingLineCount(matchingRanges);
        // TODO: this assumes the match was with the first file, another
        // refactor needs to happen to keep track which file matches with which
        // other file.
        fileTupleScores.push([matchedGroup.files[0], matchingFile, matchingRanges, score]);
      }
    }

    const equivalenceClasses: Map<FileGroup, FileGroup> = new Map(
      [...groupsSet.values()].map(group => [group, group]),
    );

    // Puts all the files in their corresponding equivalenceClass. Uses the union-find algorithm.
    for (const [matchedFile, matchingFile, , score] of fileTupleScores) {
      if (score > this.clusterCutOffValue) {
        const root1 = this.getRoot(equivalenceClasses, matchedFile.group);
        const root2 = this.getRoot(equivalenceClasses, matchingFile.group);
        equivalenceClasses.set(root1, root2);
      }
    }

    const filesGroupsMap: Map<FileGroup, Match[]> = new Map();
    const restGroup: Match[] = new Array();

    // Uses the generated equivalence classes to cluster fileTuples.
    for (const [matchedFile, matchingFile, matchingRanges] of fileTupleScores) {
      const root = this.getRoot(equivalenceClasses, matchedFile.group);
      const root2 = this.getRoot(equivalenceClasses, matchingFile.group);
      if (root === root2) {
        let filesGroup: Match[] | undefined = filesGroupsMap.get(root);
        if (!filesGroup) {
          filesGroup = new Array();
          filesGroupsMap.set(root, filesGroup);
        }
        filesGroup.push([matchedFile, matchingFile, matchingRanges]);
      } else {
        restGroup.push([matchedFile, matchingFile, matchingRanges]);
      }
    }
    const filesGroupsArray: Clustered<Match> = [...filesGroupsMap.values()];

    // Creates an equivalence class for each tuple that didn't belong to any other equivalence class.
    for (const restGroupEntry of restGroup) {
      filesGroupsArray.push([restGroupEntry]);
    }

    // Sort the contents of each group.
    for (const filesGroup of filesGroupsArray) {
      filesGroup.sort(
        ([, , rangesTupleArray1], [, , rangesTupleArray2]) =>
          this.getMaxMatchingLineCount(rangesTupleArray2) -
          this.getMaxMatchingLineCount(rangesTupleArray1),
      );
      for (const [, , rangesTupleArray] of filesGroup.values()) {
        rangesTupleArray.sort(
          ([r11, r12], [r21, r22]) =>
            Math.max(r21.getLineCount(), r22.getLineCount()) -
            Math.max(r11.getLineCount(), r12.getLineCount()),
        );
      }
    }

    // Sort the group themselves.
    filesGroupsArray.sort(
      (group1, group2) => this.getLineCountForGroup(group2) - this.getLineCountForGroup(group1),
    );
    return filesGroupsArray;
  }
  /**
   * Counts the total amount of lines contained within this group.
   * @param group The group you want to total line count of.
   */
  private getLineCountForGroup(group: Match[]): number {
    return group
      .map(([, , rangesTupleArray]) => this.getMaxMatchingLineCount(rangesTupleArray))
      .reduce((previous, accumulator) => previous + accumulator, 0);
  }

  private getScoreForArray(arr: RangesTuple[]): number {
    return arr
      .map(rangesTuple => this.getScoreForRangesTuple(rangesTuple))
      .reduce((acc, nextNumber) => acc + nextNumber);
  }

  private getScoreForRangesTuple([range1, range2]: RangesTuple): number {
    return range1.getLineCount() + range2.getLineCount();
  }

  /**
   * Searches for root of the value in the given equivalenceClasses. Performs path compression.
   * @param equivalenceClasses The current equivalence classes.
   * @param value The value you want to get the root of.
   */
  private getRoot(equivalenceClasses: Map<FileGroup, FileGroup>, value: FileGroup): FileGroup {
    const values: FileGroup[] = [];
    let root = equivalenceClasses.get(value) as FileGroup;
    let nextRoot = equivalenceClasses.get(root) as FileGroup;
    while (root !== nextRoot) {
      values.push(root);
      root = nextRoot;
      nextRoot = equivalenceClasses.get(root) as FileGroup;
    }
    values.forEach(v => equivalenceClasses.set(v, root));
    return root;
  }

  /**
   * Transforms all the tuples to rangesTuples.
   * @param matchesPerFile A many-to-many comparison of a set of files. This map contains an entry for each of the
   * input files with the key being its file name and the value a list of matches. These matches are grouped
   * per matching file. The compareFiles function of the Comparison class can generate such mapping.
   */
  private transformMatches(
    matchesPerFile: Map<FileGroup, Matches<number>>,
  ): Map<FileGroup, Matches<Range>> {
    const results: Map<FileGroup, Matches<Range>> = new Map();
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
}
