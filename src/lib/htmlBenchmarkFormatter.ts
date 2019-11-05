import fs from "fs";
import { BenchmarkResults } from "./benchmarkMatcher";
import { HTMLFormatter } from "./htmlFormatter";
import { JSONFormatter } from "./jsonFormatter";
import { ObjectMap, RangesTuple, Utils } from "./utils";

export class HTMLBenchmarkFormatter extends HTMLFormatter<[string, string, BenchmarkResults]> {
  public toComparePage(
    matchedFile: string,
    matchingFile: string,
    [settings, name, results]: [string, string, BenchmarkResults],
  ): string {
    const comparePage: string = this.toCompareView(matchedFile, matchingFile, [
      settings,
      name,
      results,
    ]);

    const id: string = HTMLBenchmarkFormatter.makeId(
      matchedFile,
      matchingFile,
      undefined,
      settings,
    );
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
    [benchmarkSettings, name, benchmarkResults]: [string, string, BenchmarkResults],
  ): string {
    const description: string = HTMLBenchmarkFormatter.escapeHtml(
      `Benchmark settings: ${benchmarkSettings}\n` +
        `Name: ${name}, files: ${matchedFile} => ${matchingFile}`,
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
      benchmarkSettings,
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
      benchmarkSettings,
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
      benchmarkSettings,
    );

    const id: string = HTMLBenchmarkFormatter.makeId(
      matchedFile,
      matchingFile,
      undefined,
      benchmarkSettings,
    );

    let checkboxes: string = "";
    if (expectedRanges.length > 0) {
      checkboxes +=
        `Expected ranges: ` +
        this.makeToggleAllButton(id, "expectedRanges", "green") +
        `<div class="ranges" id="expectedRanges">\n` +
        `${expectedRanges.join("\n")}` +
        `</div>\n`;
    }

    if (matchingFile.length > 0) {
      checkboxes +=
        `Ranges with at least one match:` +
        this.makeToggleAllButton(id, "matchingRanges", "blue") +
        `<div class="ranges" id="matchingRanges">\n` +
        `${matchingRangesTuples.join("\n")}` +
        `</div>\n`;
    }

    if (falseRangesTuples.length > 0) {
      checkboxes +=
        `Ranges with no match:` +
        this.makeToggleAllButton(id, "falseRanges", "red") +
        `<div class="ranges" id="falseRanges">\n` +
        `${falseRangesTuples.join("\n")}` +
        `</div>\n`;
    }

    return (
      `<div>\n` +
      `<hr>` +
      description +
      `</div>\n` +
      `<div class="code-comparison">\n` +
      `<div class="allRanges">\n` +
      `${checkboxes}` +
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

  public makeToggleAllButton(parentId: string, target: string, colour: string): string {
    return (
      `<div class="range" style="color: ${colour};" >` +
      `<input type="checkbox" class="toggleAll" data-target="${target}" data-parent="${parentId}">` +
      `Toggle all` +
      `</div>`
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
      for (const [name, benchmarkResults] of results.values()) {
        comparisonPages.push(
          this.toComparePage(benchmarkResults.matchedFile, benchmarkResults.matchingFile, [
            benchmarkSetting,
            name,
            benchmarkResults,
          ]),
        );
      }
      groups.push(this.makeGroupsEntry(results, benchmarkSetting));
    }
    return (
      `<div>` +
      `<p>Dolos summary</p>` +
      (this.noTime ? "" : `<p>${new Date().toUTCString()}</p>`) +
      `<hr>` +
      `</div>` +
      `<div id="Index">\n` +
      `${groups.join("\n")}\n` +
      `</div>\n` +
      `${comparisonPages.join("\n")}`
    );
  }
  protected makeBenchmarkTableRow(
    matchedFile: string,
    matchingFile: string,
    rangesTupleArray: RangesTuple[],
    benchmarkName: string,
    benchmarkSettings: string,
  ): string {
    const id: string = HTMLBenchmarkFormatter.makeId(
      matchedFile,
      matchingFile,
      undefined,
      benchmarkSettings,
    );
    const [matchedFileLineCount, matchingFileLineCount]: [
      number,
      number,
    ] = Utils.countLinesInRanges(rangesTupleArray);

    const [scoreMatchedFile, scoreMatchingFile] = this.utils.getScoreForFiles(
      rangesTupleArray,
      matchedFile,
      matchingFile,
    );
    return (
      `<tr>\n` +
      `<td class="benchmarkName-column">\n` +
      `<a href=# onclick="return swap('${id}', 'Index');">\n` +
      `${HTMLBenchmarkFormatter.escapeHtml(benchmarkName)}\n` +
      `</a>\n` +
      `</td>\n` +
      `<td class="filename-column">\n` +
      `<a href=# onclick="return swap('${id}', 'Index');">\n` +
      `${HTMLBenchmarkFormatter.escapeHtml(matchedFile)} (${scoreMatchedFile}%)\n` +
      `</a>\n` +
      `</td>\n` +
      `<td class="filename-column">` +
      `<a href=# onclick="return swap('${id}', 'Index');">\n` +
      `${HTMLBenchmarkFormatter.escapeHtml(matchingFile)} (${scoreMatchingFile}%)` +
      `</a>` +
      `</td>\n` +
      `<td class="lines-matched-column">${matchedFileLineCount}</td>\n` +
      `<td class="lines-matched-column">${matchingFileLineCount}</td>\n` +
      `</tr>`
    );
  }

  private makeGroupsEntry(group: Array<[string, BenchmarkResults]>, settings: string): string {
    const tableRows: string[] = group.map(([benchmarkName, benchmarkResults]) =>
      this.makeBenchmarkTableRow(
        benchmarkResults.matchedFile,
        benchmarkResults.matchingFile,
        benchmarkResults.falseRangesTuples.concat(benchmarkResults.matchingRangesTuples),
        benchmarkName,
        settings,
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
}
