import fs from "fs";
import { BenchmarkResults } from "./benchmarkMatcher";
import { HTMLFormatter } from "./htmlFormatter";
import { JSONFormatter } from "./jsonFormatter";
import { ObjectMap, RangesTuple, Utils } from "./utils";

export class HTMLBenchmarkFormatter extends HTMLFormatter<BenchmarkResults> {
  protected static makeBenchmarkTableRow(
    matchedFile: string,
    matchingFile: string,
    rangesTupleArray: RangesTuple[],
    benchmarkName: string,
  ): string {
    const id: string = this.makeId(matchedFile, matchingFile);
    const [matchedFileLineCount, matchingFileLineCount]: [
      number,
      number,
    ] = Utils.countLinesInRanges(rangesTupleArray);

    const [scoreMatchedFile, scoreMatchingFile] = Utils.getScoreForFiles(
      rangesTupleArray,
      matchedFile,
      matchingFile,
    );
    return (
      `<tr>\n` +
      `<td class="benchmarkName-column">\n` +
      `<a href=# onclick="return swap('${id}', 'Index');">\n` +
      `${this.escapeHtml(benchmarkName)}\n` +
      `</a>\n` +
      `</td>\n` +
      `<td class="filename-column">\n` +
      `<a href=# onclick="return swap('${id}', 'Index');">\n` +
      `${this.escapeHtml(matchedFile)} (${scoreMatchedFile}%)\n` +
      `</a>\n` +
      `</td>\n` +
      `<td class="filename-column">` +
      `<a href=# onclick="return swap('${id}', 'Index');">\n` +
      `${this.escapeHtml(matchingFile)} (${scoreMatchingFile}%)` +
      `</a>` +
      `</td>\n` +
      `<td class="lines-matched-column">${matchedFileLineCount}</td>\n` +
      `<td class="lines-matched-column">${matchingFileLineCount}</td>\n` +
      `</tr>`
    );
  }

  private static makeGroupsEntry(
    group: Array<[string, BenchmarkResults]>,
    settings: string,
  ): string {
    const tableRows: string[] = group.map(([benchmarkName, benchmarkResults]) =>
      this.makeBenchmarkTableRow(
        benchmarkResults.matchedFile,
        benchmarkResults.matchingFile,
        benchmarkResults.falseRangesTuples.concat(benchmarkResults.matchingRangesTuples),
        benchmarkName,
      ),
    );

    return (
      `<div class="group">\n` +
      `<details>\n` +
      `<summary class="clicker">\n` +
      `${settings}\n` +
      `</summary>\n` +
      `<hr>\n` +
      `<div>\n` +
      `<table>\n` +
      `<tbody>\n` +
      `<tr>\n` +
      `<th class="benchmarkName-column">Benchmark name</th>\n` +
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
  public toComparePage(
    matchedFile: string,
    matchingFile: string,
    benchmarkResults: BenchmarkResults,
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
    benchmarkResults: BenchmarkResults,
  ): string {
    const description: string = HTMLBenchmarkFormatter.escapeHtml(
      `${matchedFile} => ${matchingFile}`,
    );
    benchmarkResults.falseRangesTuples.sort(Utils.sortRangesTuples);
    benchmarkResults.matchingRangesTuples.sort(Utils.sortRangesTuples);
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
      benchmarkResults.falseRangesTuples,
      falseRangesTuples,
      "red",
      indexOffset,
    );
    indexOffset += benchmarkResults.falseRangesTuples.length;

    HTMLBenchmarkFormatter.toMarkingDivAndToggleButton(
      benchmarkResults.matchedFile,
      benchmarkResults.matchingFile,
      rightMarkedAreas,
      leftMarkedAreas,
      benchmarkResults.matchingRangesTuples,
      matchingRangesTuples,
      "blue",
      indexOffset,
    );

    indexOffset += benchmarkResults.matchingRangesTuples.length;

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
    const jsonData: ObjectMap<Array<[string, BenchmarkResults]>> = JSON.parse(
      jsonString,
      JSONFormatter.JSONReviverFunction,
    );
    const comparisonPages: string[] = new Array();
    const groups: string[] = new Array();

    for (const [benchmarkSetting, results] of Object.entries(jsonData)) {
      for (const [, benchmarkResults] of results.values()) {
        comparisonPages.push(
          this.toComparePage(
            benchmarkResults.matchedFile,
            benchmarkResults.matchingFile,
            benchmarkResults,
          ),
        );
      }
      groups.push(HTMLBenchmarkFormatter.makeGroupsEntry(results, benchmarkSetting));
    }
    return (
      `<div>` +
      `<p>Dolos summary</p>` +
      `<p>${new Date().toUTCString()}` +
      `<hr>` +
      `</div>` +
      `<div id="Index">\n` +
      `${groups.join("\n")}\n` +
      `</div>\n` +
      `${comparisonPages.join("\n")}`
    );
  }
}
