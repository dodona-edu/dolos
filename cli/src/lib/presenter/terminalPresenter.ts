import { Region } from "../util/region";
import { Presenter } from "./presenter";
import { Report, ScoredDiff } from "../analyze/report";

/// <reference types="../../../typings/cliui" />
import UI from "cliui";
import chalk from "chalk";
import { Writable } from "stream";
import { Options } from "../util/options";

export class TerminalPresenter extends Presenter {

  private ui: UI;
  private readonly width: number;
  private readonly c: chalk.Chalk;

  constructor(
    report: Report,
    options: Options,
    private readonly compare?: boolean,
    private readonly output: Writable = process.stdout,
    width?: number,
    private readonly context: number = 3,
  ) {
    super(report, options);
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

  public async present(): Promise<void> {
    const diffs = this.report.scoredDiffs;
    if (this.compare || (this.compare == null && diffs.length == 1)) {
      diffs.map(int => this.writeDiffWithComparison(int));
    } else {
      this.writeDiffs(diffs);
    }
    this.output.write(this.ui.toString() + "\n");
    this.ui.resetOutput();
  }

  private writeDiffs(diffs: Array<ScoredDiff>): void {
    const maxOver = Math.max(...diffs.map(s => s.overlap));
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
      const { diff, overlap, similarity, longest }
      of diffs
    ) {
      this.ui.div({
        text: diff.leftFile.path,
        width: pathWidth,
        padding: [0, 1, 0, 1]
      },
      {
        text: diff.rightFile.path,
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

  private writeDiffWithComparison(
    { diff, overlap, similarity }: ScoredDiff
  ): void {
    const leftLines = diff.leftFile.lines;
    const rightLines = diff.rightFile.lines;

    this.ui.div({
      text: chalk.bold(diff.leftFile.path),
      padding: [1, 1, 1, 1],
    },
    {
      text: chalk.bold(diff.rightFile.path),
      padding: [1, 1, 1, 1],
    });
    this.ui.div({
      text: chalk.bold("Absolute overlap: ") + overlap.toString() + " kmers",
      padding: [0, 1, 0, 1],
    });
    this.ui.div({
      text: chalk.bold("Similarity score: ") + similarity.toString(),
      padding: [0, 1, 1, 1],
    });

    const maxLines = Math.max(leftLines.length, rightLines.length);
    const lineNrWidth = Math.trunc(Math.log10(maxLines + 1)) + 2;
    const lineWidth = Math.trunc((this.width - 3) / 2);

    // number lines
    const nl = (i: number): string =>
      this.c.grey((i + 1).toString().padEnd(lineNrWidth));

    const blocks = diff.blocks();
    blocks.sort((b1, b2) => b1.pairs.length - b2.pairs.length);
    for (let i = 0; i < blocks.length; i += 1) {
      const block = blocks[i];

      this.ui.div({
        text: chalk.bold(`Block ${i+1}/${blocks.length}:` +
                         ` ${block.leftKmers.length} kmers`),
        align: "center",
        padding: [1, 0, 1, 0],
      });

      this.ui.div({
        text: chalk.bold("Tokens: ") + "'" +
              chalk.red(block.mergedData) + "'",
        padding: [0, 0, 1, 0],
      });

      const left = this.formatLines(block.leftSelection, leftLines, nl);
      const right = this.formatLines(block.rightSelection, rightLines, nl);

      for(let j = 0; j < Math.max(left.length, right.length); j += 1) {
        this.ui.div(
          {
            text: left[j] || "",
            width: lineWidth
          },
          {
            text: right[j] || "",
            width: lineWidth
          }
        );
      }
    }
  }

  private formatLines(
    sel: Region,
    lines: Array<string>,
    nl: (i: number) => string
  ): Array<string>{

    const column = [];

    for(let i = sel.startRow - this.context; i < sel.startRow; i += 1) {
      if (i < 0) {
        column.push("");
      } else {
        column.push(nl(i) + lines[i]);
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
        column.push(nl(i) + lines[i]);
      }
    }
    return column;
  }
}
