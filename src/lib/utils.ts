/*
 * This module contains shared helper functions.
 */

export type Colour = "red" | "green" | "reset";

/**
 * Helper function to convert a Colour 'enum' into its ANSI escape sequence.
 */
function escapeSeq(c: Colour): string {
  switch (c) {
  case "red": return "\u001b[31m";
  case "green": return "\u001b[32m";
  case "reset": return "\u001b[0m";
  }
}

/**
 * Colours your text with the given colour. Only works for terminal output.
 * @param colour The colour you want your text to be.
 * @param text The text you want to colour.
 */
export function colour(c: Colour, text: string): string {
  return `${escapeSeq(c)}${text}${escapeSeq("reset")}`;
}
