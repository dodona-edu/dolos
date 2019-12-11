import { File } from "../files/file";
import { JSONFormatter, JSONSummaryFormat } from "../formatters/jsonFormatter";
import { Match, RangesTuple } from "../utils";
import * as Utils from "../utils";
import { HTMLFormatter } from "./htmlFormatter";

export class HTMLSummaryFormatter extends HTMLFormatter<RangesTuple[]> {
  public makeBody(jsonSummary: string): string {
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
    return (
      `<div>` +
      `<p>Dolos summary</p>` +
      `<p>${new Date().toUTCString()}` +
      (jsonData.comment ? `<p>${jsonData.comment}</p>` : ``) +
      (jsonData.options ? `<p>Options: ${jsonData.options}</p>` : ``) +
      `<hr>` +
      `</div>` +
      `<div id="Index">\n` +
      `${tableRows.join("\n")}` +
      `</div>\n` +
      `${comparisonPages.join("\n")}`
    );
  }
  public toCompareView(
    matchedFile: File,
    matchingFile: File,
    matchingRangesTuples: RangesTuple[],
  ): string {
    const description: string = HTMLSummaryFormatter.escapeHtml(
      `${matchedFile} => ${matchingFile}`,
    );
    matchingRangesTuples.sort(Utils.sortRangesTuples);

    const left = matchedFile.showContent();
    const right = matchingFile.showContent();

    const leftMarkedAreas: string[] = [];
    const rightMarkedAreas: string[] = [];
    const ranges: string[] = [];

    for (const [index, [leftRange, rightRange]] of matchingRangesTuples.entries()) {
      const colourRotation: string = HTMLSummaryFormatter.getColourRotation(
        index,
        matchingRangesTuples.length,
      );
      const id: string = `${HTMLSummaryFormatter.makeId(matchedFile, matchingFile, index)}`;
      rightMarkedAreas.push(HTMLSummaryFormatter.rangeToMarkingDiv(leftRange, colourRotation, id));
      leftMarkedAreas.push(HTMLSummaryFormatter.rangeToMarkingDiv(rightRange, colourRotation, id));
      const rangesTupleString: string = `[${leftRange.toString()}, ${rightRange.toString()}]`;
      ranges.push(
        `<div class="range" style="${colourRotation}" >` +
          `<input type="checkbox" class="checkbox" data="${id}">` +
          `${HTMLSummaryFormatter.escapeHtml(rangesTupleString)}` +
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

  public toComparePage(
    matchedFile: File,
    matchingFile: File,
    matchingRangesTuples: RangesTuple[],
  ): string {
    const comparePage: string = this.toCompareView(matchedFile, matchingFile, matchingRangesTuples);

    const id: string = HTMLFormatter.makeId(matchedFile, matchingFile);
    return (
      `<div style="display:none" id="${id}">\n` +
      `<div> <a href=# onclick="return swap('Index', '${id}')">Back to index</a> </div>\n` +
      `<div>${comparePage}</div>\n` + // TODO this div can go no?
      `</div>\n`
    );
  }
  /**
   * Turns a group into an HTML representation.
   * @param group The group you want the HTML representation of.
   * @param index The group index.
   */
  private makeGroupsEntry(group: Match[], index: number): string {
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
}
