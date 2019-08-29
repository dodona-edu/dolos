import fs from "fs";
import path from "path";
import { JSONSummaryFormat } from "./jsonFormatter";
import { Range } from "./range";
import { Match, RangesTuple, Summary } from "./summary";

export class HTMLFormatter {
  public static format(jsonSummary: string): string {
    const jsonData: JSONSummaryFormat = JSON.parse(jsonSummary, (_, value) => {
      if (value instanceof Array && value.length === 2 && typeof value[0] === "number") {
        return new Range(value[0], value[1]);
      }
      return value;
    });
    const tableRows: string[] = new Array();
    const comparisonPages: string[] = new Array();

    for (let jsonGroupIndex = 0; jsonGroupIndex < jsonData.results.length; jsonGroupIndex += 1) {
      const group = jsonData.results[jsonGroupIndex];
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
      (jsonData.comment ? `<p>${jsonData.comment}</p>` : ``) +
      (jsonData.options && jsonData.options.length > 0
        ? `<p>Options: ${Summary.optionsToString(jsonData.options as Array<
            [string, string | number]
          >)}</p>`
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
   * Reads the lines in the file over the given range.
   * @param fileName The File you want to read.
   * @param range The Range of lines you want to read.
   */
  public static readFileOverRange(fileName: string, range: Range): string {
    if (!HTMLFormatter.filesContents.has(fileName)) {
      HTMLFormatter.filesContents.set(fileName, fs.readFileSync(fileName, "utf8").split("\n"));
    }
    return (HTMLFormatter.filesContents.get(fileName) as string[])
      .slice(range.from, range.to + 1)
      .join("\n");
  }

  private static readonly filesContents: Map<string, string[]> = new Map();
  private static saveHTMLMap: Map<string, string> = new Map([
    ['"', "&quot;"],
    ["&", "&amp;"],
    ["'", "&#039;"],
    ["<", "&lt;"],
    [">", "&gt;"],
  ]);
  /**
   * Turns a group into an HTML representation.
   * @param group The group you want the HTML representation of.
   * @param index The group index.
   */
  private static makeGroupsEntry(group: Match[], index: number): string {
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
   * Generates a view that contains the lines out of each file.
   * @param matchedFile The matched file name.
   * @param matchingFile The matching file name.
   * @param matchingRangesTuples The Range of a match between the two files.
   */
  private static toCompareView(
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
      `<code>${this.escapeHtml(
        HTMLFormatter.readFileOverRange(matchingFile, matchingFileRange),
      )}\n` +
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
  private static toComparePage(
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
      `<div> <a href=# onclick="return swap('Index', '${id}')">Back to index</a> </div>\n` +
      `<div>${comparePage}</div>\n` +
      `</div>\n`
    );
  }

  /**
   * Generates an html friendly id.
   * @param matchedFile The matched file.
   * @param matchingFile The matching file.
   */
  private static makeId(matchedFile: string, matchingFile: string): string {
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
  private static makeTableRow(
    matchedFile: string,
    matchingFile: string,
    rangesTupleArray: RangesTuple[],
  ): string {
    const id: string = this.makeId(matchedFile, matchingFile);
    const [matchedFileLineCount, matchingFileLineCount]: [
      number,
      number,
    ] = Summary.countLinesInRanges(rangesTupleArray);
    return (
      `<tr>\n` +
      `<td class="filename-column">\n` +
      `<a href=# onclick="return swap('${id}', 'Index');">\n` +
      `${this.escapeHtml(matchedFile)}\n` +
      `</a>\n` +
      `</td>\n` +
      `<td class="filename-column">` +
      `<a href=# onclick="return swap('${id}', 'Index');">\n` +
      `${this.escapeHtml(matchingFile)}` +
      `</a>` +
      `</td>\n` +
      `<td class="lines-matched-column">${matchedFileLineCount}</td>\n` +
      `<td class="lines-matched-column">${matchingFileLineCount}</td>\n` +
      `</tr>`
    );
  }

  /**
   * Escapes all html characters so that no cross site scripting can occur without changing how the text will be
   * displayed.
   * @param text The text you want to escape.
   */
  private static escapeHtml(text: string) {
    return text.replace(/[&<>"']/g, m => HTMLFormatter.saveHTMLMap.get(m) as string);
  }
}
