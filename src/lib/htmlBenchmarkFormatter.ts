import fs from "fs";
import { BenchmarkResultsJSONFormat } from "./benchmarkManager";
import { HTMLFormatter } from "./htmlFormatter";
import { JSONFormatter } from "./jsonFormatter";
import { RangesTuple } from "./summary";

export class HTMLBenchmarkFormatter extends HTMLFormatter {
  public static makeBody(jsonString: string): string {
    const jsonData: BenchmarkResultsJSONFormat[] = JSON.parse(
      jsonString,
      JSONFormatter.JSONReviverFunction,
    );
    const tableRows: string[] = new Array();
    const comparisonPages: string[] = new Array();

    for (const benchmarkResults of jsonData.values()) {
      tableRows.push(
        this.makeTableRow(
          benchmarkResults.matchedFile,
          benchmarkResults.matchingFile,
          benchmarkResults.actual,
        ),
      );
      comparisonPages.push(this.toViewPage(benchmarkResults));
    }
    return (
      `<div>` +
      `<p>Dolos summary</p>` +
      `<p>${new Date().toUTCString()}` +
      `<hr>` +
      `</div>` +
      `<div id="Index">\n` +
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
      `${comparisonPages.join("\n")}`
    );
  }

  private static toViewPage(benchmarkResults: BenchmarkResultsJSONFormat): string {
    const comparePage: string = this.toBenchmarkView(benchmarkResults);

    const id: string = this.makeId(benchmarkResults.matchedFile, benchmarkResults.matchingFile);
    return (
      `<div style="display:none" id="${id}">\n` +
      `<div> <a href=# onclick="return swap('Index', '${id}')">Back to index</a> </div>\n` +
      `<div>${comparePage}</div>\n` +
      `</div>\n`
    );
  }
  private static sortRangesTuples([r11, r12]: RangesTuple, [r21, r22]: RangesTuple): number {
    const diff = r11.from - r21.from;
    if (diff === 0) {
      return r12.from - r22.from;
    } else {
      return diff;
    }
  }

  private static toBenchmarkView(benchmarkResults: BenchmarkResultsJSONFormat): string {
    const description: string = this.escapeHtml(
      `${benchmarkResults.matchedFile} => ${benchmarkResults.matchingFile}`,
    );
    benchmarkResults.actual.sort((rt1, rt2) => this.sortRangesTuples(rt1, rt2));

    const left: string = fs.readFileSync(benchmarkResults.matchedFile, "utf8");
    const right: string = fs.readFileSync(benchmarkResults.matchedFile, "utf8");

    const leftMarkedAreas: string[] = [];
    const rightMarkedAreas: string[] = [];
    const expectedRanges: string[] = [];
    const actualRanges: string[] = [];

    for (const [index, [leftRange, rightRange]] of benchmarkResults.actual.entries()) {
      const id: string = `${HTMLFormatter.makeId(
        benchmarkResults.matchedFile,
        benchmarkResults.matchingFile,
        index,
      )}`;
      rightMarkedAreas.push(HTMLFormatter.rangeToMarkingDiv(leftRange, "color: red", id));
      leftMarkedAreas.push(HTMLFormatter.rangeToMarkingDiv(rightRange, "color: red", id));
      const rangesTupleString: string = `[${leftRange.toString()}, ${rightRange.toString()}]`;
      actualRanges.push(
        `<div class="range" style="color: red;" >` +
          `<input type="checkbox" class="checkbox" data="${id}">` +
          `${this.escapeHtml(rangesTupleString)}` +
          `</div>`,
      );
    }

    const indexOffset: number = benchmarkResults.actual.length - 1;
    for (const [index, [leftRange, rightRange]] of benchmarkResults.expected.entries()) {
      const id: string = `${HTMLFormatter.makeId(
        benchmarkResults.matchedFile,
        benchmarkResults.matchingFile,
        index + indexOffset,
      )}`;
      rightMarkedAreas.push(HTMLFormatter.rangeToMarkingDiv(leftRange, "color: green", id));
      leftMarkedAreas.push(HTMLFormatter.rangeToMarkingDiv(rightRange, "color: green", id));
      const rangesTupleString: string = `[${leftRange.toString()}, ${rightRange.toString()}]`;
      expectedRanges.push(
        `<div class="range" style="color: red;" >` +
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
      `${expectedRanges.join("\n")}` +
      `</div>\n` +
      `<div class="ranges">\n` +
      `${actualRanges.join("\n")}` +
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
}
