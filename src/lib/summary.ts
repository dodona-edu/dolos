import  fs  from "fs";
import path from "path";
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
  minimumFragmentLength?: number;
}

export class Summary {
  private static readonly defaultFilterOptions: FilterOptions = Object.freeze({
    fragmentOutputLimit: undefined,
    minimumFragmentLength: 0,
  });
  private static JSONReplacerFunction(zeroBase: boolean = false): (key: string, value: any) => any {
    return (_, value) => {
      if (value instanceof Range) {
        const range: Range = value as Range;
        if (zeroBase) {
          return [range.from, range.to];
        } else {
          return [range.from + 1, range.to + 1];
        }
      } else {
        return value;
      }
    };
  }
  public readonly gapSize: number;
  private readonly results: Map<string, Matches<Range>>;
  private readonly filterOptions: FilterOptions;

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
    filterOptions: FilterOptions = Summary.defaultFilterOptions,
  ) {
    this.filterOptions = filterOptions || Summary.defaultFilterOptions;
    this.gapSize = gapSize;
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

  public toJSON(zeroBase: boolean = false): string {
    const obj: any = {};
    this.results.forEach((matches, matchedFileName) => {
      const matchesObj: any = {};
      matches.forEach((matchedRanges, matchingFileName) => {
        matchesObj[matchingFileName] = matchedRanges;
      });
      obj[matchedFileName] = matchesObj;
    });
    return JSON.stringify(obj, Summary.JSONReplacerFunction(zeroBase));
  }

  private readonly filesContents: Map<string, Array<string>> = new Map();
  private readFileOverRange(fileName: string, range: Range): string {
    if(!this.filesContents.has(fileName)){
      this.filesContents.set(fileName, fs.readFileSync(fileName, "utf8").split('\n'));
    }
    return (this.filesContents.get(fileName) as Array<string>).slice(range.from , range.to + 1 ).join('\n');
  }
  private toCompareView(matchedFile: string, matchingFile: string, matchingRangesTuples: RangesTuple): string {
    const [ matchingFileRange, matchedFileRange] = matchingRangesTuples;
    return `\n<div class="code-comparison">\n` + 
              `<div class="left-column">${this.escapeHtml(`>>>File: ${matchedFile}, lines: ${matchedFileRange.toString()}`)}\n` +
              `<hr>\n` +
              `<div><code>${this.escapeHtml(this.readFileOverRange(matchedFile, matchedFileRange))}</code></div>\n` +
              `</div>\n` + 
              `<div class="right-column">${this.escapeHtml(`>>>File: ${matchingFile}, lines: ${matchingFileRange.toString()}` )}\n` +
              `<hr>\n` +
              `<div><code>${this.escapeHtml(this.readFileOverRange(matchingFile, matchingFileRange))}</code></div>\n` +
              `</div>\n` +
        `</div>\n`
  }

  private toComparePage(matchedFile: string, matchingFile: string, matchingRangesTuples: Array<RangesTuple>): string {
    const comparePage: string = matchingRangesTuples
      .map(rangesTuple => this.toCompareView(matchedFile, matchingFile, rangesTuple))
      .join('\n');

    const id: string = this.makeId(matchedFile, matchingFile);
    return `<div style="display:none" id="${id}">` + 
        `<div> <a href=# onclick="return show('Index', '${id}')">Back to index</a> </div>`+
        `<div>${comparePage}</div>` + 
        `</div>`;
  }

  private makeId(matchedFile: string, matchingFile: string): string {
    return `${this.escapeHtml(matchedFile)}-${this.escapeHtml(matchingFile)}`
  }

  private makeTableRow(matchedFile: string, matchingFile: string, rangesTupleArray: Array<RangesTuple>): string {
    const id: string = this.makeId(matchedFile, matchingFile);
    return `<tr>` + 
        `<td><a href=# onclick="return show('${id}', 'Index');">${this.escapeHtml(matchedFile)}</a></td>` + 
        `<td><a href=# onclick="return show('${id}', 'Index');">${this.escapeHtml(matchingFile)}</a></td>` + 
        `<td  align="right">${this.getScoreForArray( rangesTupleArray)}</td>` + 
        `</tr>`
  }


  private readonly clusterCutOffValue: number = 0.5;
  // TODO documentation
  // TODO split up in smaller functions perhaps?
  private clusterResults(results: Map<string, Matches<Range>>): Array<Array<[string , string, Array<RangesTuple>]>> { 
    const filesSet: Set<string> = new Set();
    const fileTupleScores: Array<[string, string, Array<RangesTuple>, number]> = new Array();
    let maxScore: number = Number.MIN_VALUE;

    for(const [matchedFile, matches] of results.entries()){
      filesSet.add(matchedFile);
      for(const [matchingFile, matchingRanges] of matches.entries()) {
        filesSet.add(matchingFile);
        const score = this.getScoreForArray(matchingRanges);
        maxScore = Math.max(maxScore, score);
        fileTupleScores.push([matchedFile, matchingFile, matchingRanges, score])
      }
    }

    //TODO maybe make an array so that int => int and mapping all files to an int if that is faster.
    const equivalenceClasses: Map<string ,string> = new Map([...filesSet.values()].map((file) => [file, file]));
    for(const [matchedFile, matchingFile, _, score] of fileTupleScores) {
      if (score / maxScore > this.clusterCutOffValue) { //TODO think of a good score cut off value and better score function
        const root1: string = this.getRoot(equivalenceClasses, matchedFile);
        const root2: string = this.getRoot(equivalenceClasses, matchingFile);
        equivalenceClasses.set(root1, root2);
      }
    }


    const filesGroupsMap: Map< string, Array<[string, string, Array<RangesTuple>]>> = new Map();
    const restGroup: Array<[string, string, Array<RangesTuple>]> = new Array();
    for(const [matchedFile, matchingFile, matchingRanges, ] of fileTupleScores) {
      const root: string = this.getRoot(equivalenceClasses ,matchedFile);
      if( root === this.getRoot(equivalenceClasses, matchingFile)) {
        let filesGroup: Array<[string, string, Array<RangesTuple>]> | undefined = filesGroupsMap.get(root);
        if(!filesGroup) {
          filesGroup = new Array();
          filesGroupsMap.set(root, filesGroup);
        }
        filesGroup.push([matchedFile, matchingFile, matchingRanges]);
      } else {
        restGroup.push([matchedFile, matchingFile, matchingRanges]);
      }
    }
    const filesGroupsArray: Array<Array<[string, string, Array<RangesTuple>]>> = [...filesGroupsMap.values()];

    filesGroupsArray.push(restGroup);

    //TODO sort filesGroupsArray 
    return filesGroupsArray;
    }

  //TODO decomentation
  private getRoot(equivalenceClasses: Map<string, string>, value: string): string {
    //TODO implement
    //TODO path compression maybe?

    return '';
  }

  //TODO improve this code
  private escapeHtml(text: string) {
    const map: any = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };

    return text.replace(/[&<>"']/g, m =>  map[m]);
  }

  public toHTML(): string {
    const JSONData: any = JSON.parse(this.toJSON());
    const tableRows: Array<string> = new Array();
    const comparisonPages: Array<string> = new Array();

    for( const [matchedFile, matches] of Object.entries(JSONData)){
      for(const [matchingFile, rangesTupleArrayObj] of Object.entries(matches as any)) {

        const rangesTuplesArray: Array<RangesTuple> = this.numberTupleArrayToRangesTuplesArray(rangesTupleArrayObj as Array<[[number, number], [number, number]]>);
        tableRows.push(this.makeTableRow(matchedFile, matchingFile, rangesTuplesArray));
        comparisonPages.push(this.toComparePage(matchedFile, matchingFile, rangesTuplesArray));
      }
    }
    const stylesheet: string = fs.readFileSync(path.resolve("./src/lib/assets/stylesheet.css"), "utf8");
    const script : string = fs.readFileSync(path.resolve("./src/lib/assets/scripts.js"), "utf8");

    const body: string = `
<div id="Index">
  <table>
    <tr>
      <th>File 1</th>
      <th>File 2</th>
      <th>Lines matched</th>
    </tr>
    ${tableRows.join('\n')}
  </table>
</div>
${comparisonPages.join('\n')}
    `;

    //TODO put script in separate file instead of just reading it
    return `<!doctype html>
<html lang="en">
<head>
  <script type="text/javascript">
  ${script}
  </script>
  <style type="text/css">
  ${stylesheet}
  </style>
  <meta charset="utf-8">
  <meta content="utf-8">
  <title>Dolos summary</title>
</head>

<body>
  ${body}
</body>
</html>`;
  }
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
      .map((resultEntry) => {
        const [sourceFileName, subMap] = resultEntry;
        let subOutput = "";
        subOutput += `source: ${sourceFileName}\n\n`;
        const linesInSourceFile: number = this.countLinesInFile(sourceFileName);

        const entryArray: Array<[string, RangesTuple[]]> = Array.from(subMap.entries());

        subOutput += entryArray
          .map(  (subMapEntry) => {
            let matchedFilenameOutput = "";
            const [matchedFileName, rangesTupleArray] = subMapEntry;
            const score: number = rangesTupleArray
              .map(rangesTuple => rangesTuple[0].getLineCount())
              .reduce((accumulator, nextValue) => accumulator + nextValue);

            if (!linesInFileMap.has(matchedFileName)) {
              linesInFileMap.set(matchedFileName,this.countLinesInFile(matchedFileName));
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

  private numberTupleArrayToRangesTuplesArray(
    numberTupleArray: Array<[[number, number], [number, number]]>,
  ): RangesTuple[] {
    return numberTupleArray.map(([[from1, to1], [from2, to2]]) => [
      new Range(from1, to1),
      new Range(from2, to2),
    ]);
  }

  private  countLinesInFile(fileName: string): number {
    return (fs.readFileSync(fileName, "utf8")).split("\n").length;
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
            this.getScoreForRangesTuple(rangesTuple2) - this.getScoreForRangesTuple(rangesTuple1),
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

  // TODO cache results
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
