import fs from "fs";
import path from "path";
import { Matches } from "./comparison";
import { Range } from "./range";
export type RangesTuple = [Range, Range];

export type Clustered<T> = T[][];
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
  public static readonly JSONReplacerFunction: (key: string, value: any) => any = (_, value) => {
    if (value instanceof Range) {
      const range: Range = value as Range;
      return [range.from + 1, range.to + 1];
    } else {
      return value;
    }
  }
  private static readonly defaultFilterOptions: FilterOptions = Object.freeze({
    fragmentOutputLimit: undefined,
    minimumFragmentLength: 0,
  });
  private static readonly colours: Map<string, string> = new Map([
    ["FgRed", "\x1b[31m"],
    ["FgGreen", "\x1b[32m"],
    ["Reset", "\x1b[0m"],
  ]);

  public readonly gapSize: number;
  private consoleColours: boolean = false;
  private readonly clusteredResults: Clustered<[string, string, RangesTuple[]]>;
  private readonly filterOptions: FilterOptions;
  private readonly clusterCutOffValue: number;
  private readonly filesContents: Map<string, string[]> = new Map();
  // Maps the file to the amount of lines in that file.
  private readonly linesInFileMap: Map<string, number> = new Map();

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
    matchesPerFile: Map<string, Matches<number>>,
    gapSize: number = 0,
    filterOptions?: FilterOptions,
    clusterCutOffValue: number = 15,
  ) {
    this.clusterCutOffValue = clusterCutOffValue;
    this.filterOptions = filterOptions || Summary.defaultFilterOptions;
    this.gapSize = gapSize;
    this.filterOptions = filterOptions || Summary.defaultFilterOptions;
    let results = this.transformMatches(matchesPerFile);
    results = this.filterOutputAmount(results);
    this.clusteredResults = this.clusterResults(results);
  }

  /**
   * Limits the amount of RangesTuples in the results.
   * @param matchesPerFile The results you want to filter.
   */
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

    let matchesPerFileScoreArray: Array<[string, string, RangesTuple[], number]> = new Array();
    for (const [matchedFile, matches] of matchesPerFile.entries()) {
      for (const [matchingFile, rangesTupleArray] of matches.entries()) {
        matchesPerFileScoreArray.push([
          matchingFile,
          matchedFile,
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
      this.filterOptions.fragmentOutputLimit,
    );

    const filteredMatchesPerFile: Map<string, Matches<Range>> = new Map();
    for (const [matchedFile, matchingFile, rangesTupleArray] of matchesPerFileScoreArray) {
      let matches: Matches<Range> | undefined = filteredMatchesPerFile.get(matchedFile);
      if (!matches) {
        matches = new Map();
        filteredMatchesPerFile.set(matchedFile, matches);
      }

      matches.set(matchingFile, rangesTupleArray);
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
        Math.min(rangesTuple[0].getLineCount(), rangesTuple[1].getLineCount()) >=
        (this.filterOptions.minimumFragmentLength || 0),
    );
  }

  /**
   * Generates a JSON representation of this summary.
   * @param comment A string you want to add to the report.
   * @param options The options used to generate the report.L0
   */
  public toJSON(comment?: string, options?: Array<[string, string | number]>): string {
    const toJSONObj: any = { results: this.clusteredResults };
    if (comment) {
      toJSONObj.comment = comment;
    }
    if (options && options.length > 0) {
      toJSONObj.options = options;
    }
    return JSON.stringify(toJSONObj, Summary.JSONReplacerFunction);
  }

  /**
   * Turns a group into an HTML representation.
   * @param group The group you want the HTML representation of.
   * @param index The group index.
   */
  public makeGroupsEntry(group: Array<[string, string, RangesTuple[]]>, index: number): string {
    const tableRows: string[] = group.map(([matchedFile, matchingFile, rangesTupleArray]) =>
      this.makeTableRow(matchedFile, matchingFile, rangesTupleArray),
    );

    return (
      `<div class="group" style="border: 3px solid black;">\n` +
      `Cluster number ${index + 1}<hr>` +
      `<table><tbody>\n` +
      `<tr>\n` +
      `<th class="filename-column">File 1</th>\n` +
      `<th class="filename-column">File 2</th>\n` +
      `<th class="lines-matched-column">Lines matched in File 1</th>\n` +
      `<th class="lines-matched-column">Lines matched in File 2</th>\n` +
      `</tr>\n` +
      `${tableRows.join("\n")}\n` +
      `</tbody></table>\n` +
      `</div>\n`
    );
  }

  /**
   * Generates a html representation of this summary.
   * @param comment A comment you want to add to the report.
   * @param options The options that were used to generate this report.
   */
  public toHTML(comment?: string, options?: Array<[string, string | number]>): string {
    const jsonData: Clustered<
      [string, string, Array<[[number, number], [number, number]]>]
    > = JSON.parse(this.toJSON()).results;
    const tableRows: string[] = new Array();
    const comparisonPages: string[] = new Array();

    for (let jsonGroupIndex = 0; jsonGroupIndex < jsonData.length; jsonGroupIndex += 1) {
      const jsonGroup = jsonData[jsonGroupIndex];
      const group: Array<[string, string, RangesTuple[]]> = jsonGroup.map(
        ([matchedFile, matchingFile, rangesTupleArray]) => [
          matchedFile,
          matchingFile,
          this.numberTupleArrayToRangesTuplesArray(rangesTupleArray),
        ],
      );
      tableRows.push(this.makeGroupsEntry(group, jsonGroupIndex));
      for (const [matchedFile, matchingFile, rangesTupleObj] of group) {
        comparisonPages.push(this.toComparePage(matchedFile, matchingFile, rangesTupleObj));
      }
    }
    const stylesheet: string = fs.readFileSync(
      path.resolve("./src/lib/assets/stylesheet.css"),
      "utf8",
    );
    const script: string = fs.readFileSync(path.resolve("./src/lib/assets/scripts.js"), "utf8");

    const body: string =
      `<div>` +
      `<p>Dolos summary</p>` +
      `<p>${new Date().toUTCString()}` +
      (comment ? `<p>${comment}</p>` : ``) +
      (options && options.length > 0
        ? `<p>Options: ${this.optionsToString(options as Array<[string, string | number]>)}</p>`
        : ``) +
      `<hr>` +
      `</div>` +
      `<div id="Index">\n` +
      `${tableRows.join("\n")}` +
      `</div>\n` +
      `${comparisonPages.join("\n")}`;

    return (
      `<!doctype html>` +
      `<html lang="en">` +
      `<head>` +
      `<script type="text/javascript">` +
      `${script}` +
      `</script>` +
      `<style type="text/css">` +
      `${stylesheet}` +
      `</style>` +
      `<meta charset="utf-8">` +
      `<meta content="utf-8">` +
      `<title>Dolos summary</title>` +
      `</head>` +
      `<body> ` +
      `${body} ` +
      `</body> ` +
      `</html>`
    );
  }
  /**
   * Returns the maximum from the tuples returned from [[this.countLinesInRanges]].
   * @param rangesTupleArray The rangesTupleArray you want the maximum line count of.
   */
  public getMaxMatchingLineCount(rangesTupleArray: RangesTuple[]): number {
    return Math.max(...this.countLinesInRanges(rangesTupleArray));
  }

  public optionsToString(optionsArray: Array<[string, string | number]>): string {
    return (
      optionsArray
        .map(([flag, optionValue]) => {
          if (typeof optionValue === "string" && optionValue.includes(" ")) {
            return [flag, `'${optionValue}'`];
          }
          return [flag, optionValue];
        })
        .map(([flag, optionValue]) => `${flag} ${optionValue}`)
        .join(" ") + "\n"
    );
  }

  public toString(
    comment?: string,
    consoleColours: boolean = false,
    optionsArray?: Array<[string, string | number]>,
  ): string {
    this.consoleColours = consoleColours;
    if (this.clusteredResults.length === 0) {
      return "There were no matches";
    }

    let output = "";
    if (comment !== undefined) {
      output += comment + "\n";
    }
    if (optionsArray && optionsArray.length > 0) {
      output += `Options: ${this.optionsToString(optionsArray)}\n`;
    }

    for (let index = 0; index < this.clusteredResults.length; index += 1) {
      output += this.colour("FgRed", `Cluster ${index + 1}\n`);
      output += this.groupToString(this.clusteredResults[index]).replace("\n", "\t\n");
      output += "\n";
    }

    return output;
  }

  public groupToString(group: Array<[string, string, RangesTuple[]]>): string {
    return group.map(groupEntry => this.groupEntryToString(groupEntry)).join("\n") + "\n";
  }

  public groupEntryToString([matchedFile, matchingFile, matches]: [
    string,
    string,
    RangesTuple[],
  ]): string {
    const matchesString: string = matches
      .map(match => JSON.stringify(match, Summary.JSONReplacerFunction))
      .join("\n\t\t");

    const [matchedLinesInMatchedFile, matchedLinesInMatchingFile]: [
      number,
      number,
    ] = this.countLinesInRanges(matches);

    const linesInMatchedFile: number = this.countLinesInFile(matchedFile);
    const linesInMatchingFile: number = this.countLinesInFile(matchingFile);
    const scoreMatchedFile: number = Math.round(
      (matchedLinesInMatchedFile / linesInMatchedFile) * 100,
    );
    const scoreMatchingFile: number = Math.round(
      (matchedLinesInMatchingFile / linesInMatchingFile) * 100,
    );
    return (
      this.colour(
        "FgGreen",
        `\t${matchedFile}(${scoreMatchedFile}%) + ${matchingFile}(${scoreMatchingFile}%) => \n`,
      ) + `\t\t${matchesString}`
    );
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
   * Reads the lines in the file over the given range.
   * @param fileName The File you want to read.
   * @param range The Range of lines you want to read.
   */
  public readFileOverRange(fileName: string, range: Range): string {
    if (!this.filesContents.has(fileName)) {
      this.filesContents.set(fileName, fs.readFileSync(fileName, "utf8").split("\n"));
    }
    return (this.filesContents.get(fileName) as string[])
      .slice(range.from, range.to + 1)
      .join("\n");
  }

  /**
   * Clusters the results based on [[this.clusterCutOffValue]].
   * @param results The results you want to cluster.
   */
  public clusterResults(
    results: Map<string, Matches<Range>>,
  ): Clustered<[string, string, RangesTuple[]]> {
    const filesSet: Set<string> = new Set();
    const fileTupleScores: Array<[string, string, RangesTuple[], number]> = new Array();

    // Maps the results to tuples containing the two files, the matches between those two files and a score for that
    // File pair. Also fills the file set.
    for (const [matchedFile, matches] of results.entries()) {
      filesSet.add(matchedFile);
      for (const [matchingFile, matchingRanges] of matches.entries()) {
        filesSet.add(matchingFile);
        const score = this.getMaxMatchingLineCount(matchingRanges);
        fileTupleScores.push([matchedFile, matchingFile, matchingRanges, score]);
      }
    }

    const equivalenceClasses: Map<string, string> = new Map(
      [...filesSet.values()].map(file => [file, file]),
    );

    // Puts all the files in their corresponding equivalenceClass. Uses the union-find algorithm.
    for (const [matchedFile, matchingFile, , score] of fileTupleScores) {
      if (score > this.clusterCutOffValue) {

        const root1: string = this.getRoot(equivalenceClasses, matchedFile);
        const root2: string = this.getRoot(equivalenceClasses, matchingFile);
        equivalenceClasses.set(root1, root2);
      }
    }

    const filesGroupsMap: Map<string, Array<[string, string, RangesTuple[]]>> = new Map();
    const restGroup: Array<[string, string, RangesTuple[]]> = new Array();

    // Uses the generated equivalence classes to cluster fileTuples.
    for (const [matchedFile, matchingFile, matchingRanges] of fileTupleScores) {
      const root: string = this.getRoot(equivalenceClasses, matchedFile);
      const root2: string = this.getRoot(equivalenceClasses, matchingFile);
      if (root === root2) {
        let filesGroup: Array<[string, string, RangesTuple[]]> | undefined = filesGroupsMap.get(
          root,
        );
        if (!filesGroup) {
          filesGroup = new Array();
          filesGroupsMap.set(root, filesGroup);
        }
        filesGroup.push([matchedFile, matchingFile, matchingRanges]);
      } else {
        restGroup.push([matchedFile, matchingFile, matchingRanges]);
      }
    }
    const filesGroupsArray: Clustered<[string, string, RangesTuple[]]> = [
      ...filesGroupsMap.values(),
    ];

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
    }

    // Sort the group themselves.
    filesGroupsArray.sort(
      (group1, group2) => this.getLineCountForGroup(group2) - this.getLineCountForGroup(group1),
    );
    return filesGroupsArray;
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
   * Colours your text with the given colour. Only works for terminal output.
   * @param colour The colour you want your text to be.
   * @param text The text you want to colour.
   */
  private colour(colour: string, text: string): string {
    if (!Summary.colours.has(colour) || !this.consoleColours) {
      return text;
    }
    return `${Summary.colours.get(colour)}${text}${Summary.colours.get("Reset")}`;
  }

  /**
   * Counts the total amount of lines that correspond with the first and second file.
   * @param rangesTupleArray The rangesTupleArray you want the lines count of.
   * @returns A tuple that contais the line for the first and second file respectively.
   */
  private countLinesInRanges(rangesTupleArray: RangesTuple[]): [number, number] {
    return rangesTupleArray
      .map(([range1, range2]) => [range1.getLineCount(), range2.getLineCount()] as [number, number])
      .reduce(([acc1, acc2], [next1, next2]) => [acc1 + next1, acc2 + next2]);
  }

  /**
   * Generates a view that contains the lines out of each file.
   * @param matchedFile The matched file name.
   * @param matchingFile The matching file name.
   * @param matchingRangesTuples The Range of a match between the two files.
   */
  private toCompareView(
    matchedFile: string,
    matchingFile: string,
    matchingRangesTuples: RangesTuple,
  ): string {
    const [matchingFileRange, matchedFileRange] = matchingRangesTuples;
    const descriptionFile1: string = this.escapeHtml(
      `>>>File: ${matchedFile}, lines: ${matchedFileRange.toString()}`,
    );
    const descriptionFile2: string = this.escapeHtml(
      `>>>File: ${matchingFile}, lines: ${matchingFileRange.toString()}`,
    );
    return (
      `<div class="code-comparison">\n` +
      `<div class="left-column">${descriptionFile1}\n` +
      `<hr>\n` +
      `<div>` +
      `<code>${this.escapeHtml(this.readFileOverRange(matchedFile, matchedFileRange))}
      </code>\n` +
      `</div>\n` +
      `</div>\n` +
      `<div class="right-column">${descriptionFile2}\n` +
      `<hr>\n` +
      `<div>\n` +
      `<code>${this.escapeHtml(this.readFileOverRange(matchingFile, matchingFileRange))}\n` +
      `</code>\n` +
      `</div>\n` +
      `</div>\n` +
      `</div>\n`
    );
  }

  /**
   * Generates a page containing an overview of all the matches.
   * @param matchedFile The matched file name.
   * @param matchingFile The matching file name
   * @param matchingRangesTuples The matches between the two files.
   */
  private toComparePage(
    matchedFile: string,
    matchingFile: string,
    matchingRangesTuples: RangesTuple[],
  ): string {
    const comparePage: string = matchingRangesTuples
      .map(rangesTuple => this.toCompareView(matchedFile, matchingFile, rangesTuple))
      .join("\n");

    const id: string = this.makeId(matchedFile, matchingFile);
    return (
      `<div style="display:none" id="${id}">\n` +
      `<div> <a href=# onclick="return show('Index', '${id}')">Back to index</a> </div>\n` +
      `<div>${comparePage}</div>\n` +
      `</div>\n`
    );
  }

  /**
   * Generates an html friendly id.
   * @param matchedFile The matched file.
   * @param matchingFile The matching file.
   */
  private makeId(matchedFile: string, matchingFile: string): string {
    return `${this.escapeHtml(matchedFile.replace(/-/gi, ""))}-${this.escapeHtml(
      matchingFile.replace(/-/gi, ""),
    )}`;
  }

  /**
   * Generates a table row that can be used to navigate to the comparison page.
   * @param matchedFile The matched file name.
   * @param matchingFile The matching file name.
   * @param rangesTupleArray The matches between the two files.
   */
  private makeTableRow(
    matchedFile: string,
    matchingFile: string,
    rangesTupleArray: RangesTuple[],
  ): string {
    const id: string = this.makeId(matchedFile, matchingFile);
    const [matchedFileLineCount, matchingFileLineCount]: [number, number] = this.countLinesInRanges(
      rangesTupleArray,
    );
    return (
      `<tr>\n` +
      `<td class="filename-column">\n` +
      `<a href=# onclick="return show('${id}', 'Index');">\n` +
      `${this.escapeHtml(matchedFile)}\n` +
      `</a>\n` +
      `</td>\n` +
      `<td class="filename-column">` +
      `<a href=# onclick="return show('${id}', 'Index');">\n` +
      `${this.escapeHtml(matchingFile)}` +
      `</a>` +
      `</td>\n` +
      `<td class="lines-matched-column">${matchedFileLineCount}</td>\n` +
      `<td class="lines-matched-column">${matchingFileLineCount}</td>\n` +
      `</tr>`
    );
  }

  /**
   * Counts the total amount of lines contained within this group.
   * @param group The group you want to total line count of.
   */
  private getLineCountForGroup(group: Array<[string, string, RangesTuple[]]>): number {
    return group
      .map(([, , rangesTupleArray]) => this.getMaxMatchingLineCount(rangesTupleArray))
      .reduce((previous, accumulator) => previous + accumulator, 0);
  }

  /**
   * Searches for root of the value in the given equivalenceClasses. Performs path compression.
   * @param equivalenceClasses The current equivalence classes.
   * @param value The value you want to get the root of.
   */
  private getRoot(equivalenceClasses: Map<string, string>, value: string): string {
    const values: string[] = [];
    let root: string = equivalenceClasses.get(value) as string;
    let nextRoot: string = equivalenceClasses.get(root) as string;
    while (root !== nextRoot) {
      values.push(root);
      root = nextRoot;
      nextRoot = equivalenceClasses.get(root) as string;
    }
    values.forEach(lambdaValue => equivalenceClasses.set(lambdaValue, root));
    return root;
  }

  /**
   * Escapes all html characters so that no cross site scripting can occur without changing how the text will be
   * displayed.
   * @param text The text you want to escape.
   */
  private escapeHtml(text: string) {
    const map: any = {
      '"': "&quot;",
      "&": "&amp;",
      "'": "&#039;",
      "<": "&lt;",
      ">": "&gt;",
    };

    return text.replace(/[&<>"']/g, m => map[m]);
  }

  private numberTupleArrayToRangesTuplesArray(
    numberTupleArray: Array<[[number, number], [number, number]]>,
  ): RangesTuple[] {
    return numberTupleArray.map(([[from1, to1], [from2, to2]]) => [
      new Range(from1, to1),
      new Range(from2, to2),
    ]);
  }

  private countLinesInFile(fileName: string): number {
    if (!this.linesInFileMap.has(fileName)) {
      this.linesInFileMap.set(fileName, fs.readFileSync(fileName, "utf8").split("\n").length);
    }
    return this.linesInFileMap.get(fileName) as number;
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
}
