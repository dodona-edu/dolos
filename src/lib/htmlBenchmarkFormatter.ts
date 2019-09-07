import fs from "fs";
import { BenchmarkResultsJSONFormat } from "./benchmarkManager";
import { HTMLFormatter } from "./htmlFormatter";
import { JSONFormatter } from "./jsonFormatter";
import { Utils } from "./utils";

export class HTMLBenchmarkFormatter extends HTMLFormatter<BenchmarkResultsJSONFormat> {
  public toComparePage(
    matchedFile: string,
    matchingFile: string,
    benchmarkResults: BenchmarkResultsJSONFormat,
  ): string {
    const comparePage: string = this.toCompareView(matchedFile, matchingFile, benchmarkResults);

    const id: string = HTMLBenchmarkFormatter.makeId(matchedFile, matchingFile);
    return (
      `<div style="display:none" id="${id}">\n` +
      `<div> <a href=# onclick="return swap('Index', '${id}')">Back to index</a> </div>\n` +
      `<div>${comparePage}</div>\n` +
      `</div>\n`
    );
  }

  public toCompareView(
    matchedFile: string,
    matchingFile: string,
    benchmarkResults: BenchmarkResultsJSONFormat,
  ): string {
    const description: string = HTMLBenchmarkFormatter.escapeHtml(
      `${matchedFile} => ${matchingFile}`,
    );
    benchmarkResults.benchmarkResults.falseRangesTuples.sort(
      Utils.sortRangesTuples,
    );
    benchmarkResults.benchmarkResults.matchingRangesTuples.sort(
      Utils.sortRangesTuples,
    );
    benchmarkResults.expected.sort(Utils.sortRangesTuples);

    const right: string = fs.readFileSync(matchingFile, "utf8");
    const left: string = fs.readFileSync(matchedFile, "utf8");

    const leftMarkedAreas: string[] = [];
    const rightMarkedAreas: string[] = [];
    const expectedRanges: string[] = [];
    const falseRangesTuples: string[] = [];
    const matchingRangesTuples: string[] = [];

    let indexOffset: number = 0;
    HTMLBenchmarkFormatter.toMarkingDivAndToggleButton(
      benchmarkResults.matchedFile,
      benchmarkResults.matchingFile,
      rightMarkedAreas,
      leftMarkedAreas,
      benchmarkResults.benchmarkResults.falseRangesTuples,
      falseRangesTuples,
      "red",
      indexOffset,
    );
    indexOffset += benchmarkResults.benchmarkResults.falseRangesTuples.length;

    HTMLBenchmarkFormatter.toMarkingDivAndToggleButton(
      benchmarkResults.matchedFile,
      benchmarkResults.matchingFile,
      rightMarkedAreas,
      leftMarkedAreas,
      benchmarkResults.benchmarkResults.matchingRangesTuples,
      matchingRangesTuples,
      "blue",
      indexOffset,
    );

    indexOffset += benchmarkResults.benchmarkResults.matchingRangesTuples.length;

    HTMLBenchmarkFormatter.toMarkingDivAndToggleButton(
      benchmarkResults.matchedFile,
      benchmarkResults.matchingFile,
      rightMarkedAreas,
      leftMarkedAreas,
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
  public makeBody(jsonString: string): string {
    const jsonData: BenchmarkResultsJSONFormat[] = JSON.parse(
      jsonString,
      JSONFormatter.JSONReviverFunction,
    );
    const tableRows: string[] = new Array();
    const comparisonPages: string[] = new Array();

    for (const benchmarkResults of jsonData.values()) {
      tableRows.push(
        HTMLBenchmarkFormatter.makeTableRow(
          benchmarkResults.matchedFile,
          benchmarkResults.matchingFile,
          benchmarkResults.benchmarkResults.falseRangesTuples.concat(
            benchmarkResults.benchmarkResults.matchingRangesTuples,
          ),
        ),
      );
      comparisonPages.push(
        this.toComparePage(
          benchmarkResults.matchedFile,
          benchmarkResults.matchingFile,
          benchmarkResults,
        ),
      );
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
}
