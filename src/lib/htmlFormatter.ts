import fs from "fs";
import path from "path";
import { JSONFormatter, JSONSummaryFormat } from "./jsonFormatter";
import { Range } from "./range";
import { Match, RangesTuple, Summary } from "./summary";

export class HTMLFormatter {
  public static format(jsonSummary: string): string {
    const jsonData: JSONSummaryFormat = JSON.parse(jsonSummary, JSONFormatter.JSONReviverFunction);
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
        ? `<p>Options: ${Summary.optionsToString(jsonData.options)}</p>`
        : ``) +
      `<hr>` +
      `</div>` +
      `<div id="Index">\n` +
      `${tableRows.join("\n")}` +
      `</div>\n` +
      `${comparisonPages.join("\n")}`;

    return (
      `<!doctype html>\n` +
      `<html lang="en">\n` +
      `<head>\n` +
      `<meta charset="utf-8">\n` +
      `<title>Dolos summary</title>\n` +
      `<script>\n` +
      `${script}` +
      `</script>\n` +
      `<style>\n` +
      `${stylesheet}` +
      `</style>\n` +
      `</head>\n` +
      `<body>\n` +
      `${body}` +
      `</body>\n` +
      `</html>\n`
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

  public static getColourRotation(index: number, total: number): string {
    return `filter: hue-rotate(${(360 / total) * index}deg)`;
  }
  private static readonly filesContents: Map<string, string[]> = new Map();
  private static readonly saveHTMLMap: Map<string, string> = new Map([
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
      `<div class="group">\n` +
      `<details>\n` +
      `<summary class="clicker">\n` +
      `Cluster number ${index + 1}\n` +
      `</summary>\n` +
      `<hr>\n` +
      `<div>\n` +
      `<table>\n` +
      `<tbody>\n` +
      `<tr>\n` +
      `<th class="filename-column">File 1</th>\n` +
      `<th class="filename-column">File 2</th>\n` +
      `<th class="lines-matched-column">Lines matched in File 1</th>\n` +
      `<th class="lines-matched-column">Lines matched in File 2</th>\n` +
      `</tr>\n` +
      `${tableRows.join("\n")}\n` +
      `</tbody>\n` +
      `</table>\n` +
      `</div>\n` +
      `</details>\n` +
      `</div>\n`
    );
  }

  private static rangeToMarkingDiv(range: Range, colourRotation: string, id: string): string {
    const style: string[] = [
      `top: ${range.from * 16}px`,
      `height: ${(range.to - range.from + 1) * 16}px`,
      `${colourRotation}`,
    ];
    return `<div class="markingDiv" style="${style.join("; ")}" id="${id}"></div>`;
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
    matchingRangesTuples: RangesTuple[],
  ): string {
    const description: string = this.escapeHtml(`${matchedFile} => ${matchingFile}`);
    matchingRangesTuples.sort(([r11, r12], [r21, r22]) => {
      const diff = r21.from - r11.from;
      if (diff === 0) {
        return r22.from - r12.from;
      } else {
        return diff;
      }
    });

    const left: string = fs.readFileSync(matchedFile, "utf8");
    const right: string = fs.readFileSync(matchingFile, "utf8");

    const leftMarkedAreas: string[] = [];
    const rightMarkedAreas: string[] = [];
    const ranges: string[] = [];

    for (const [index, [leftRange, rightRange]] of matchingRangesTuples.entries()) {
      const colourRotation: string = HTMLFormatter.getColourRotation(
        index,
        matchingRangesTuples.length,
      );
      const id: string = `${HTMLFormatter.makeId(matchedFile, matchingFile, index)}`;
      rightMarkedAreas.push(HTMLFormatter.rangeToMarkingDiv(leftRange, colourRotation, id));
      leftMarkedAreas.push(HTMLFormatter.rangeToMarkingDiv(rightRange, colourRotation, id));
      const rangesTupleString: string = `[${leftRange.toString()}, ${rightRange.toString()}]`;
      ranges.push(
        `<div class="range" style="${colourRotation}" >` +
          `<input type="checkbox" class="checkbox" data="${id}">` +
          `${this.escapeHtml(rangesTupleString)}` +
          `</div>`,
      );
    }

    return (
      `<div>\n` +
      `<hr>` +
      description +
      `</div>\n` +
      `<div class="code-comparison">\n` +
      `<div class="ranges">\n` +
      `${ranges.join("\n")}` +
      `</div>\n` +
      `<div class="left-column">\n` +
      `${leftMarkedAreas.join("\n")}` +
      `<pre class="code">\n` +
      `${left}\n` +
      `</pre>\n` +
      `</div>\n` +
      `<div class="right-column">\n` +
      `${rightMarkedAreas.join("\n")}` +
      `<pre class="code">\n` +
      `${right}\n` +
      `</pre>\n` +
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
    const comparePage: string = this.toCompareView(matchedFile, matchingFile, matchingRangesTuples);

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
  private static makeId(matchedFile: string, matchingFile: string, index?: number): string {
    let id: string = `${this.escapeHtml(matchedFile.replace(/-/gi, ""))}-${this.escapeHtml(
      matchingFile.replace(/-/gi, ""),
    )}`;
    if (index !== undefined) {
      id += `-${index}`;
    }
    // return base64 version of id;
    return Buffer.from(id)
      .toString("base64")
      .replace(/=/g, "");
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
