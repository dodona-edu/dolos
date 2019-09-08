import fs from "fs";
import path from "path";
import { Range } from "./range";
import { RangesTuple, Utils } from "./utils";

export abstract class HTMLFormatter<T> {
  /**
   * Generates a colour rotation for a given item so that each item has a unique colour.
   * @param index The index of the item.
   * @param total The total amount of items.
   */
  public static getColourRotation(index: number, total: number): string {
    return `filter: hue-rotate(${(360 / total) * index}deg)`;
  }

  /**
   * Escapes all html characters so that no cross site scripting can occur. This is done without changing how the text
   * would be display outside of html.
   * @param text The text you want to escape.
   */
  protected static escapeHtml(text: string) {
    return text.replace(/[&<>"']/g, m => this.saveHTMLMap.get(m) as string);
  }

  /**
   * Generates a div that marks a section of code in the code overview.
   * @param range The range you want to mark
   * @param colourRotation The colour rotation you want to use.
   * @param id The id of the markingDiv
   */
  protected static rangeToMarkingDiv(range: Range, styleing: string, id: string): string {
    const style: string[] = [
      `top: ${range.from * 16}px`,
      `height: ${(range.to - range.from + 1) * 16}px`,
      `${styleing}`,
    ];
    return `<div class="markingDiv" style="${style.join("; ")}" id="${id}"></div>`;
  }

  /**
   * Generates an html friendly id.
   * @param matchedFile The matched file.
   * @param matchingFile The matching file.
   */
  protected static makeId(
    matchedFile: string,
    matchingFile: string,
    index?: number,
    groupId?: string,
  ): string {
    let id: string = `${this.escapeHtml(matchedFile.replace(/-/gi, ""))}-${this.escapeHtml(
      matchingFile.replace(/-/gi, ""),
    )}`;
    if (index !== undefined) {
      id += `-${index}`;
    }
    if (groupId !== undefined) {
      id += `-${groupId}`;
    }
    // return base64 version of id without any `=` symbols;
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
  protected static makeTableRow(
    matchedFile: string,
    matchingFile: string,
    rangesTupleArray: RangesTuple[],
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

  protected static toMarkingDivAndToggleButton(
    matchedFile: string,
    matchingFile: string,
    rightMarkedAreas: string[],
    leftMarkedAreas: string[],
    rangesTuples: RangesTuple[],
    rangesList: string[],
    colour: string,
    indexOffset: number = 0,
    benchmarkSettings?: string,
  ) {
    for (const [index, [leftRange, rightRange]] of rangesTuples.entries()) {
      const id: string = `${HTMLFormatter.makeId(
        matchedFile,
        matchingFile,
        index + indexOffset,
        benchmarkSettings,
      )}`;
      leftMarkedAreas.push(HTMLFormatter.rangeToMarkingDiv(leftRange, `background: ${colour}`, id));
      rightMarkedAreas.push(
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

  private static readonly saveHTMLMap: Map<string, string> = new Map([
    ['"', "&quot;"],
    ["&", "&amp;"],
    ["'", "&#039;"],
    ["<", "&lt;"],
    [">", "&gt;"],
  ]);
  protected readonly scriptLocation = "./src/lib/assets/scripts.js";
  protected readonly stylesheetLocation = "./src/lib/assets/stylesheet.css";
  public abstract makeBody(jsonString: string): string;

  /**
   * Generates a view that contains the lines out of each file.
   * @param matchedFile The matched file name.
   * @param matchingFile The matching file name.
   * @param comparisonData The data to be displayed on the view.
   */
  public abstract toCompareView(
    matchedFile: string,
    matchingFile: string,
    comparisonData: T,
  ): string;

  /**
   * Generates a page containing an overview of the given data.
   * @param matchedFile The matched file name.
   * @param matchingFile The matching file name
   * @param comparisonData The data to be displayed on the page.
   */
  public abstract toComparePage(
    matchedFile: string,
    matchingFile: string,
    comparisonData: T,
  ): string;

  public format(jsonString: string): string {
    const stylesheet: string = fs.readFileSync(path.resolve(this.stylesheetLocation), "utf8");
    const script: string = fs.readFileSync(path.resolve(this.scriptLocation), "utf8");

    const body: string = this.makeBody(jsonString);

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
}
