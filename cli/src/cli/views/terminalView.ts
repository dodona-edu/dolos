import { Region } from "@dodona/dolos-lib/dist/lib/util/region";
import { View } from "./view";
import { Report, ScoredPairs } from "@dodona/dolos-lib/dist/lib/analyze/report";

/// <reference types="../../../typings/cliui" />
import UI from "cliui";
import chalk from "chalk";
import { Writable } from "stream";
import { Fragment } from "@dodona/dolos-lib/dist/lib/analyze/fragment";
import { closestMatch } from "@dodona/dolos-lib/dist/lib/util/utils";

/**
 * This {@link View} will print the results of an analysis to the terminal.
 */
export class TerminalView extends View {

  private ui: UI;
  private output: Writable;
  private readonly fragmentSortBy?: string;
  private readonly compare: boolean;
  private readonly width: number;
  private readonly c: chalk.Chalk;
  private readonly context: number = 3;

  constructor(
    private report: Report,
    options: {
      compare?: boolean;
      context?: number;
      fragmentSortBy?: string;
    },
  ) {

    super();
    this.compare = options.compare == undefined
      ? report.files().length == 2
      : options.compare;
    this.output = process.stdout;
    this.width = process.stdout.columns;
    const colorLevel = Math.min(3, process.stdout?.getColorDepth() || 0);
    this.c = new chalk.Instance({ level: colorLevel as 0 | 1 | 2 | 3 });
    this.ui = new UI({
      wrap: true,
      width: this.width,
    });
  }

  public async show(): Promise<void> {
    const pairs = this.report.scoredPairs;
    if (this.compare || (this.compare == null && pairs.length == 1)) {
      pairs.map(int => this.writePairWithComparison(int));
    } else {
      this.writePairs(pairs);
    }
    this.output.write(this.ui.toString() + "\n");
    this.ui.resetOutput();
  }

  private writePairs(pairs: Array<ScoredPairs>): void {
    const maxOver = Math.max(...pairs.map(s => s.overlap));
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
      text: chalk.bold("Longest fragment"),
      width: overlapWidth,
      padding: [1, 1, 1, 1]
    },
    {
      text: chalk.bold("Total overlap"),
      width: overlapWidth,
      padding: [1, 1, 1, 1]
    });

    for (
      const { pair, overlap, similarity, longest }
      of pairs
    ) {
      this.ui.div({
        text: pair.leftFile.path,
        width: pathWidth,
        padding: [0, 1, 0, 1]
      },
      {
        text: pair.rightFile.path,
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

  private writePairWithComparison(
    { pair, overlap, similarity }: ScoredPairs
  ): void {
    const leftLines = pair.leftFile.lines;
    const rightLines = pair.rightFile.lines;

    this.ui.div({
      text: chalk.bold(pair.leftFile.path),
      padding: [1, 1, 1, 1],
    },
    {
      text: chalk.bold(pair.rightFile.path),
      padding: [1, 1, 1, 1],
    });
    this.ui.div({
      text: chalk.bold("Total overlap: ") + overlap.toString() + " kgrams",
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

    const fragments = pair.fragments();

    type FragmentSorter = (b1: Fragment, b2: Fragment) => number;
    const fragmentSorter = closestMatch<FragmentSorter | null>(
      this.fragmentSortBy || "file order",
      {
        "file order": null,
        "kgrams ascending": (a, b) => b.pairs.length - a.pairs.length,
        "kgrams descending": (a, b) => a.pairs.length - b.pairs.length,
      });

    if(fragmentSorter) {
      fragments.sort(fragmentSorter);
    }

    for (let i = 0; i < fragments.length; i += 1) {
      const fragment = fragments[i];

      this.ui.div({
        text: chalk.bold(`Fragment ${i+1}/${fragments.length}:` +
                         ` ${fragment.leftkgrams.length} kgrams`),
        align: "center",
        padding: [1, 0, 1, 0],
      });

      this.ui.div({
        text: chalk.bold("Tokens: ") + "'" +
              chalk.red(fragment.mergedData) + "'",
        padding: [0, 0, 1, 0],
      });

      const left = this.formatLines(fragment.leftSelection, leftLines, nl);
      const right = this.formatLines(fragment.rightSelection, rightLines, nl);

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
