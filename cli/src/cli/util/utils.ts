import { LanguageError } from "@dodona/dolos-lib";
/*
 * This module contains shared helper functions.
 */

export type Colour = "red" | "green" | "yellow" | "blue" | "reset";

/**
 * Helper function to convert a Colour 'enum' into its ANSI escape sequence.
 */
function escapeSeq(c: Colour): string {
  switch (c) {
  case "red": return "\u001b[31m";
  case "green": return "\u001b[32m";
  case "yellow": return "\u001b[33m";
  case "blue": return "\u001b[34m";
  case "reset": return "\u001b[0m";
  }
}

/**
 * Colours your text with the given colour. Only works for terminal output.
 * @param c The colour you want your text to be.
 * @param text The text you want to colour.
 */
export function colour(c: Colour, text: unknown): string {
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

export function closestMatch<V>(input: string, options: {[key: string]: V}): V | null {
  for(const key of Object.keys(options)) {
    if(key.startsWith(input)) {
      return options[key];
    }
  }
  return null;
}


type LogLevelName = "info" | "warning" | "error";

const logLevel = {
  "info": 3,
  "warning": 2,
  "error": 1,
};

const logColor: {[level: string]: Colour} = {
  "info": "blue",
  "warning": "yellow",
  "error": "red",
};

let currentLogLevel: number = logLevel["warning"];

export function setLogging(level: LogLevelName): void {
  currentLogLevel = logLevel[level];
}

export function log(level: LogLevelName, msg: unknown, ...other: unknown[]): void {
  if (logLevel[level] <= currentLogLevel) {
    console.error(colour(logColor[level], `[${ level }]`) + ` ${ msg }`, ...other);
  }
}

export function info(msg: unknown, ...other: unknown[]): void {
  log("info",msg, ...other);
}

export function warning(msg: unknown, ...other: unknown[]): void {
  log("warning", msg, ...other);
}

export function error(msg: unknown, ...other: unknown[]): void {
  log("error", msg, ...other);
}

export async function tryCatch(verbose: boolean, run: () => Promise<void>): Promise<void> {
  try {
    await run();
  } catch (err) {
    let message = err.message;
    if (err instanceof LanguageError) {
      message += "\nPlease specify the language with the --language flag.";
    }
    error(message);
    if (verbose) {
      error(err.stack);
    }
    process.exit(1);
  }
}




