import { Intersection } from "./intersection";
import { Writable } from "stream";
/// <reference types="../../typings/cliui" />
import UI from "cliui";
import chalk from "chalk";
import { default as fsWithCallbacks } from "fs";
const fs = fsWithCallbacks.promises;

export class TerminalWriter {

  //private static context = 3;
  private ui: UI;
  private readonly width: number;
  private readonly c: chalk.Chalk;

  constructor(
    private readonly output: Writable = process.stdout,
    width: number | null = null
  ) {
    let colorLevel = 0;
    if (output == process.stdout) {
      this.width = width || process.stdout.columns;
      colorLevel = Math.min(3, process.stdout.getColorDepth());
    } else {
      this.width = width || +Infinity;
    }
    this.c = new chalk.Instance({ level: colorLevel });
    this.ui = new UI({
      wrap: true,
      width: this.width,
    });
  }

  public async write(intersections: Array<Intersection>): Promise<void> {
    for (const i of intersections){
      await this.writeIntersection(i);
    }
  }

  public async writeIntersection(intersection: Intersection): Promise<void> {
    const leftLines = await this.readLines(intersection.leftFile);
    const rightLines = await this.readLines(intersection.rightFile);

    this.ui.div({
      text: chalk.bold(intersection.leftFile),
      padding: [1, 1, 1, 1],
    },
    {
      text: chalk.bold(intersection.rightFile),
      padding: [1, 1, 1, 1]
    })

    const maxLines = Math.max(leftLines.length, rightLines.length);
    const lineNrWidth = Math.trunc(Math.log10(maxLines + 1)) + 2;
    const lineWidth = Math.trunc((this.width - 3) / 2);

    for (let i = 0; i < maxLines; i += 1) {
      let leftLineNr, leftLine, rightLineNr, rightLine;
      if (i < leftLines.length) {
        leftLineNr = `${i+1}`;
        leftLine = leftLines[i];
      } else {
        leftLineNr = "";
        leftLine = "";
      }
      if (i < rightLines.length) {
        rightLineNr = `${i+1}`;
        rightLine = rightLines[i];
      } else {
        rightLineNr = "";
        rightLine = "";
      }

      this.ui.div({
        text: this.c.grey(leftLineNr.toString().padEnd(lineNrWidth)) + leftLine,
        width: lineWidth,
      },
      {
        text: this.c.grey(rightLineNr.toString().padEnd(lineNrWidth)) + rightLine,
        width: lineWidth,
      });
    }

    this.output.write(this.ui.toString());
    this.ui.resetOutput();
  }

  public async readLines(file: string): Promise<Array<string>> {
    return (await fs.readFile(file)).toString().split("\n");
  }
}
