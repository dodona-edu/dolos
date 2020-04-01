import { Intersection } from "./intersection";
import { Selection } from "./selection";

/// <reference types="../../typings/cliui" />
import UI from "cliui";
import chalk from "chalk";
import { Writable } from "stream";
import { default as fsWithCallbacks } from "fs";
const fs = fsWithCallbacks.promises;

export class TerminalWriter {

  private ui: UI;
  private readonly width: number;
  private readonly c: chalk.Chalk;

  constructor(
    private readonly output: Writable = process.stdout,
    width: number | null = null,
    private readonly context: number = 3
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

    // number lines
    const nl = (i: number): string =>
      this.c.grey((i + 1).toString().padEnd(lineNrWidth));

    for (const match of intersection.matches) {
      console.dir(match);

      const left = this.formatLines(match.leftSelection, leftLines, nl);
      const right = this.formatLines(match.rightSelection, rightLines, nl);

      this.ui.div()

      for(let i = 0; i < Math.max(left.length, right.length); i += 1) {
        this.ui.div(
          {
            text: left[i],
            width: lineWidth
          },
          {
            text: right[i],
            width: lineWidth
          }
        )
      }
    }


    this.output.write(this.ui.toString());
    this.ui.resetOutput();
  }

  private formatLines(
    sel: Selection,
    lines: Array<string>,
    nl: (i: number) => string
  ): Array<string>{

    const column = [];

    for(let i = sel.startRow - this.context; i < sel.startRow; i += 1) {
      if (i < 0) {
        column.push("");
      } else {
        column.push(nl(i) + lines[i])
      }
    }

    if (sel.startRow == sel.endRow) {
      const line = lines[sel.startRow];
      column.push(
        nl(sel.startRow) +
        line.substring(0, sel.startCol) +
        this.c.green(line.substring(sel.startCol, sel.endCol)) +
        line.substring(sel.endCol)
      );
    } else {
      const startLine = lines[sel.startRow];
      column.push(
        nl(sel.startRow) +
        startLine.substring(0, sel.startCol) +
        this.c.green(startLine.substring(sel.startCol))
      );
      for(let i = sel.startRow + 1; i < sel.endRow; i += 1) {
        nl(i) +
        column.push(this.c.green(lines[i]));
      }
      const endLine = lines[sel.endRow];
      column.push(
        nl(sel.endRow) +
        this.c.green(endLine.substring(0, sel.endCol)) +
        endLine.substring(sel.endCol)
      );
    }

    for(let i = sel.endRow + 1; i < sel.endRow + this.context; i += 1) {
      if (i >= lines.length) {
        column.push("");
      } else {
        column.push(nl(i) + lines[i])
      }
    }
    return column;
  }

  public async readLines(file: string): Promise<Array<string>> {
    return (await fs.readFile(file)).toString().split("\n");
  }
}
