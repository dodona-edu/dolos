/*
 * This module contains shared helper functions.
 */

import { Range } from "./range";

export type Colour = "red" | "green" | "reset";
export type RangesTuple = [Range, Range];
export type Clustered<T> = T[][];
export type Match = [string, string, RangesTuple[]];

export interface ObjectMap<T> {
  [key: string]: T;
}

/**
 * Colours your text with the given colour. Only works for terminal output.
 * @param colour The colour you want your text to be.
 * @param text The text you want to colour.
 */
export function colour(c: Colour, text: string): string {
  return `${escapeSeq(c)}${text}${escapeSeq("reset")}`;
}

/**
 * Helper function to convert a Colour 'enum' into its ANSI escape sequence.
 */
function escapeSeq(c: Colour) {
  switch (c) {
    case "red": return "\u001b[31m";
    case "green": return "\u001b[32m";
    case "reset": return "\u001b[0m";
  }
}

/**
 * Counts the total amount of lines that correspond with the first and second file.
 * @param rangesTupleArray The rangesTupleArray you want the lines count of.
 * @returns A tuple that contais the line for the first and second file respectively.
 */
export function countLinesInRanges(rangesTupleArray: RangesTuple[]): [number, number] {
  return rangesTupleArray
    .map(([range1, range2]) => [range1.getLineCount(), range2.getLineCount()] as [number, number])
    .reduce(([acc1, acc2], [next1, next2]) => [acc1 + next1, acc2 + next2]);
}

export function optionsToString(optionsArray: Array<[string, string | number]>): string {
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

export function sortRangesTuples([r11, r12]: RangesTuple, [r21, r22]: RangesTuple): number {
  const diff = r11.from - r21.from;
  if (diff === 0) {
    return r12.from - r22.from;
  } else {
    return diff;
  }
}
