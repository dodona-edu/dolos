import fs from "fs";
import { Range } from "./range";

export type RangesTuple = [Range, Range];
export type Clustered<T> = T[][];
export type Match = [string, string, RangesTuple[]];

export interface ObjectMap<T> {
  [key: string]: T;
}

export class Utils {
  /**
   * Colours your text with the given colour. Only works for terminal output.
   * @param colour The colour you want your text to be.
   * @param text The text you want to colour.
   * @param consoleColours If you want to colour the text or not.
   */
  public static colour(colour: string, text: string): string {
    if (!this.colours.has(colour)) {
      return text;
    }
    return `${this.colours.get(colour)}${text}${this.colours.get("Reset")}`;
  }
  /**
   * Counts the total amount of lines that correspond with the first and second file.
   * @param rangesTupleArray The rangesTupleArray you want the lines count of.
   * @returns A tuple that contais the line for the first and second file respectively.
   */
  public static countLinesInRanges(rangesTupleArray: RangesTuple[]): [number, number] {
    return rangesTupleArray
      .map(([range1, range2]) => [range1.getLineCount(), range2.getLineCount()] as [number, number])
      .reduce(([acc1, acc2], [next1, next2]) => [acc1 + next1, acc2 + next2]);
  }

  public static optionsToString(optionsArray: Array<[string, string | number]>): string {
    return (
      optionsArray
        .map(([flag, optionValue]) => {
          if (typeof optionValue === "string" && optionValue.includes(" ")) {
            return [flag, `'${optionValue}'`];
          }
          return [flag, optionValue];
        })
        .map(([flag, optionValue]) => `${flag} ${optionValue}`)
        .join(" ") + "\n"
    );
  }
  public static sortRangesTuples([r11, r12]: RangesTuple, [r21, r22]: RangesTuple): number {
    const diff = r11.from - r21.from;
    if (diff === 0) {
      return r12.from - r22.from;
    } else {
      return diff;
    }
  }
  private static readonly colours: Map<string, string> = new Map([
    ["FgRed", "\x1b[31m"],
    ["FgGreen", "\x1b[32m"],
    ["Reset", "\x1b[0m"],
  ]);

  private readonly linesInFileMap: Map<string, number> = new Map();

  public getScoreForFiles(
    matches: RangesTuple[],
    matchedFile: string,
    matchingFile: string,
  ): [number, number] {
    const [matchedLinesInMatchedFile, matchedLinesInMatchingFile]: [
      number,
      number,
    ] = Utils.countLinesInRanges(matches);

    const linesInMatchedFile: number = this.countLinesInFile(matchedFile);
    const linesInMatchingFile: number = this.countLinesInFile(matchingFile);
    const scoreMatchedFile: number = Math.round(
      (matchedLinesInMatchedFile / linesInMatchedFile) * 100,
    );
    const scoreMatchingFile: number = Math.round(
      (matchedLinesInMatchingFile / linesInMatchingFile) * 100,
    );

    return [scoreMatchedFile, scoreMatchingFile];
  }
  public countLinesInFile(fileName: string): number {
    if (!this.linesInFileMap.has(fileName)) {
      this.linesInFileMap.set(fileName, fs.readFileSync(fileName, "utf8").split("\n").length);
    }
    return this.linesInFileMap.get(fileName) as number;
  }
}
