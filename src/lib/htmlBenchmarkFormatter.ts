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
          benchmarkResults.benchmarkResults.falseRangesTuples.concat(
            benchmarkResults.benchmarkResults.matchingRangesTuples,
          ),
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

  private static toMarkingDivAndToggleButton(
    benchmarkResults: BenchmarkResultsJSONFormat,
    leftMarkedAreas: string[],
    rightMarkedAreas: string[],
    rangesTuples: RangesTuple[],
    rangesList: string[],
    colour: string,
    indexOffset: number = 0,
  ) {
    for (const [index, [leftRange, rightRange]] of rangesTuples.entries()) {
      const id: string = `${HTMLFormatter.makeId(
        benchmarkResults.matchedFile,
        benchmarkResults.matchingFile,
        index + indexOffset,
      )}`;
      rightMarkedAreas.push(
        HTMLFormatter.rangeToMarkingDiv(leftRange, `background: ${colour}`, id),
      );
      leftMarkedAreas.push(
        HTMLFormatter.rangeToMarkingDiv(rightRange, `background: ${colour}`, id),
      );
      const rangesTupleString: string = `[${leftRange.toString()}, ${rightRange.toString()}]`;
      rangesList.push(
        `<div class="range" style="color: ${colour};" >` +
          `<input type="checkbox" class="checkbox" data="${id}">` +
          `${this.escapeHtml(rangesTupleString)}` +
          `</div>`,
      );
    }
  }

  private static toBenchmarkView(benchmarkResults: BenchmarkResultsJSONFormat): string {
    const description: string = this.escapeHtml(
      `${benchmarkResults.matchedFile} => ${benchmarkResults.matchingFile}`,
    );
    benchmarkResults.benchmarkResults.falseRangesTuples.sort(this.sortRangesTuples);
    benchmarkResults.benchmarkResults.matchingRangesTuples.sort(this.sortRangesTuples);
    benchmarkResults.expected.sort(this.sortRangesTuples);

    const right: string = fs.readFileSync(benchmarkResults.matchingFile, "utf8");
    const left: string = fs.readFileSync(benchmarkResults.matchedFile, "utf8");

    const leftMarkedAreas: string[] = [];
    const rightMarkedAreas: string[] = [];
    const expectedRanges: string[] = [];
    const falseRangesTuples: string[] = [];
    const matchingRangesTuples: string[] = [];

    let indexOffset: number = 0;
    this.toMarkingDivAndToggleButton(
      benchmarkResults,
      leftMarkedAreas,
      rightMarkedAreas,
      benchmarkResults.benchmarkResults.falseRangesTuples,
      falseRangesTuples,
      "red",
      indexOffset,
    );
    indexOffset += benchmarkResults.benchmarkResults.falseRangesTuples.length;

    this.toMarkingDivAndToggleButton(
      benchmarkResults,
      leftMarkedAreas,
      rightMarkedAreas,
      benchmarkResults.benchmarkResults.matchingRangesTuples,
      matchingRangesTuples,
      "blue",
      indexOffset,
    );

    indexOffset += benchmarkResults.benchmarkResults.matchingRangesTuples.length;

    this.toMarkingDivAndToggleButton(
      benchmarkResults,
      leftMarkedAreas,
      rightMarkedAreas,
      benchmarkResults.expected,
      expectedRanges,
      "green",
      indexOffset,
    );

    return (
      `<div>\n` +
      `<hr>` +
      description +
      `</div>\n` +
      `<div class="code-comparison">\n` +
      `<div class="allRanges">\n` +
      `Expected ranges:` +
      `<div class="ranges">\n` +
      `${expectedRanges.join("\n")}` +
      `</div>\n` +
      `Ranges with at least one match:` +
      `<div class="ranges">\n` +
      `${matchingRangesTuples.join("\n")}` +
      `</div>\n` +
      `Ranges with no match:` +
      `<div class="ranges">\n` +
      `${falseRangesTuples.join("\n")}` +
      `</div>\n` +
      `</div>\n` +
      `<div class="left-column">\n` +
      `${rightMarkedAreas.join("\n")}` +
      `<pre class="code">\n` +
      `${left}\n` +
      `</pre>\n` +
      `</div>\n` +
      `<div class="right-column">\n` +
      `${leftMarkedAreas.join("\n")}` +
      `<pre class="code">\n` +
      `${right}\n` +
      `</pre>\n` +
      `</div>\n` +
      `</div>\n`
    );
  }
}
