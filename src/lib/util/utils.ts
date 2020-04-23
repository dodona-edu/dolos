/*
 * This module contains shared helper functions.
 */

export type Colour = "red" | "green" | "yellow" | "reset";

/**
 * Helper function to convert a Colour 'enum' into its ANSI escape sequence.
 */
function escapeSeq(c: Colour): string {
  switch (c) {
  case "red": return "\u001b[31m";
  case "green": return "\u001b[32m";
  case "yellow": return "\u001b[33m";
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


const indentLength = 42;
const maxLineLength: number = (process.stdout.columns as number) - indentLength;
const defaultLength = 12; // " (default: )"

/**
 * Indent the lines of helpText with an indent size of indentLength. Every line
 * will be at most maxLineLength. All the lines (except the first one) will be
 * indented with indentLength, which is the same indent size used by
 * commander.js. If a default value is present, it's length will be accounted
 * for at the end of the helpText.
 * @param helpText the text to be indented
 * @param defaultValue the default value used, will be appended as
 * "(default: [value])" by commander.js after the helpText
 */
export function indent(
  helpText: string,
  defaultValue?: { toString: () => string }
): string {
  const lines: string[] = [];
  let currentLine = "";
  for (const word of helpText.split(" ")) {
    if (currentLine.length + word.length < maxLineLength - 10) {
      if (currentLine.length === 0) {
        currentLine = word;
      } else {
        currentLine += " " + word;
      }
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if(defaultValue !== undefined){
    const defaultValueLength: number =
      typeof defaultValue === "string" ?
        defaultValue.toString().length + 2 :
        defaultValue.toString().length;

    if((currentLine.length + defaultLength + defaultValueLength)
       >= maxLineLength -1) {

      currentLine += "\n".padEnd(indentLength - 1, " ");
    }
  }
  lines.push(currentLine);

  return lines.join("\n".padEnd(indentLength, " "));
}
