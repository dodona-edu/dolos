import { Selection } from "../util/selection";
import { Analysis, ScoredIntersection } from "../analyze/analysis";

/// <reference types="../../../typings/cliui" />
import UI from "cliui";
import chalk from "chalk";
import { Writable } from "stream";

export class TerminalWriter {

  private ui: UI;
  private readonly width: number;
  private readonly c: chalk.Chalk;

  constructor(
    private readonly compare?: boolean,
    private readonly output: Writable = process.stdout,
    width?: number,
    private readonly context: number = 3,
  ) {
    let colorLevel = 0;
    if (output == process.stdout) {
      this.width = width || process.stdout.columns;
      if(process.stdout.getColorDepth) {
        colorLevel = Math.min(3, process.stdout.getColorDepth());
      } else {
        colorLevel = 0;
      }
    } else {
      this.width = width || +Infinity;
    }
    this.c = new chalk.Instance({ level: colorLevel as 0 | 1 | 2 | 3 });
    this.ui = new UI({
      wrap: true,
      width: this.width,
    });
  }

  public write(analysis: Analysis): void {
    const intersections = analysis.scoredIntersections();
    if (this.compare || (this.compare == null && intersections.length == 1)) {
      intersections.map(int => this.writeIntersectionWithComparison(int));
    } else {
      this.writeIntersections(intersections);
    }
    this.output.write(this.ui.toString() + "\n");
    this.ui.resetOutput();
  }

  private writeIntersections(intersections: Array<ScoredIntersection>): void {
    const maxOver = Math.max(...intersections.map(s => s.overlap));
    const overlapWidth = Math.max(15, Math.trunc(Math.log10(maxOver + 1)) + 2);
    const similarityWidth = 12;
    const pathWidth = (this.width - similarityWidth - 2*overlapWidth) / 2;

    // header
    this.ui.div({
      text: chalk.bold("File path"),
      width: pathWidth,
      padding: [1, 1, 1, 1]
    },
    {
      text: chalk.bold("File path"),
      width: pathWidth,
      padding: [1, 1, 1, 1]
    },
    {
      text: chalk.bold("Similarity"),
      width: similarityWidth,
      padding: [1, 1, 1, 1]
    },
    {
      text: chalk.bold("Cont. overlap"),
      width: overlapWidth,
      padding: [1, 1, 1, 1]
    },
    {
      text: chalk.bold("Total overlap"),
      width: overlapWidth,
      padding: [1, 1, 1, 1]
    });

    for (
      const { intersection, overlap, similarity, longest }
      of intersections
    ) {
      this.ui.div({
        text: intersection.leftFile.path,
        width: pathWidth,
        padding: [0, 1, 0, 1]
      },
      {
        text: intersection.rightFile.path,
        width: pathWidth,
        padding: [0, 1, 0, 1]
      },
      {
        text: (Math.trunc(similarity * 1000000) / 1000000).toString(),
        width: similarityWidth,
        padding: [0, 1, 0, 1]
      },
      {
        text: longest.toString(),
        width: overlapWidth,
        padding: [0, 1, 0, 1]
      },
      {
        text: overlap.toString(),
        width: overlapWidth,
        padding: [0, 1, 0, 1]
      });
    }
  }

  private writeIntersectionWithComparison(
    { intersection, overlap, similarity }: ScoredIntersection
  ): void {
    const leftLines = intersection.leftFile.lines;
    const rightLines = intersection.rightFile.lines;

    this.ui.div({
      text: chalk.bold(intersection.leftFile.path),
      padding: [1, 1, 1, 1],
    },
    {
      text: chalk.bold(intersection.rightFile.path),
      padding: [1, 1, 1, 1],
    })
    this.ui.div({
      text: chalk.bold("Absolute overlap: ") + overlap.toString() + " kmers",
      padding: [0, 1, 0, 1],
    })
    this.ui.div({
      text: chalk.bold("Similarity score: ") + similarity.toString(),
      padding: [0, 1, 1, 1],
    })

    const maxLines = Math.max(leftLines.length, rightLines.length);
    const lineNrWidth = Math.trunc(Math.log10(maxLines + 1)) + 2;
    const lineWidth = Math.trunc((this.width - 3) / 2);

    // number lines
    const nl = (i: number): string =>
      this.c.grey((i + 1).toString().padEnd(lineNrWidth));

    for (let i = 0; i < intersection.fragments.length; i += 1) {
      const fragment = intersection.fragments[i];

      this.ui.div({
        text: chalk.bold(`Fragment ${i+1}/${intersection.fragments.length}:` +
                         ` ${fragment.leftKmers.length} kmers`),
        align: "center",
        padding: [1, 0, 1, 0],
      })

      this.ui.div({
        text: chalk.bold("Tokens: ") + "'" +
              chalk.red(fragment.mergedData) + "'",
        padding: [0, 0, 1, 0],
      })

      const left = this.formatLines(fragment.leftSelection, leftLines, nl);
      const right = this.formatLines(fragment.rightSelection, rightLines, nl);

      for(let i = 0; i < Math.max(left.length, right.length); i += 1) {
        this.ui.div(
          {
            text: left[i] || "",
            width: lineWidth
          },
          {
            text: right[i] || "",
            width: lineWidth
          }
        );
      }
    }
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
        column.push(nl(i) + this.c.green(lines[i]));
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
}
