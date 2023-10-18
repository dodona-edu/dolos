import { View } from "./view.js";

/// <reference types="../../../typings/cliui" />
import UI from "cliui";
import { Writable } from "stream";
import { closestMatch } from "../util/utils.js";
import { Report, Fragment, Region, Pair } from "@dodona/dolos-lib";
import { Chalk, ChalkInstance } from "chalk";

/**
 * This {@link View} will print the results of an analysis to the terminal.
 */
export class TerminalView extends View {

  private ui: UI;
  private output: Writable;
  private readonly fragmentSortBy?: string;
  private readonly compare: boolean;
  private readonly width: number;
  private readonly c: ChalkInstance;
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
      ? report.files.length == 2
      : options.compare;
    this.fragmentSortBy = options.fragmentSortBy;
    this.output = process.stdout;
    this.width = process.stdout.columns;
    this.c = new Chalk();
    this.ui = new UI({
      wrap: true,
      width: this.width,
    });
  }

  public async show(): Promise<void> {
    const pairs = this.report.allPairs();
    if (this.compare || (this.compare == null && pairs.length == 1)) {
      pairs.map(pair => this.writePairWithComparison(pair));
    } else {
      this.writePairs(pairs);
    }
    this.output.write(this.ui.toString() + "\n");
    this.ui.resetOutput();
  }

  private writePairs(pairs: Array<Pair>): void {
    const maxOver = pairs.reduce((curMax: number, pair: Pair) => Math.max(pair.overlap, curMax), 0);
    const overlapWidth = Math.max(15, Math.trunc(Math.log10(maxOver + 1)) + 2);
    const similarityWidth = 12;
    const pathWidth = (this.width - similarityWidth - 2*overlapWidth) / 2;

    // header
    this.ui.div({
      text: this.c.bold("File path"),
      width: pathWidth,
      padding: [1, 1, 1, 1]
    },
    {
      text: this.c.bold("File path"),
      width: pathWidth,
      padding: [1, 1, 1, 1]
    },
    {
      text: this.c.bold("Similarity"),
      width: similarityWidth,
      padding: [1, 1, 1, 1]
    },
    {
      text: this.c.bold("Longest fragment"),
      width: overlapWidth,
      padding: [1, 1, 1, 1]
    },
    {
      text: this.c.bold("Total overlap"),
      width: overlapWidth,
      padding: [1, 1, 1, 1]
    });

    for (
      const pair
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
        text: (Math.trunc(pair.similarity * 1000000) / 1000000).toString(),
        width: similarityWidth,
        padding: [0, 1, 0, 1]
      },
      {
        text: pair.longest.toString(),
        width: overlapWidth,
        padding: [0, 1, 0, 1]
      },
      {
        text: pair.overlap.toString(),
        width: overlapWidth,
        padding: [0, 1, 0, 1]
      });
    }
  }

  private writePairWithComparison(
    pair: Pair
  ): void {
    const leftLines = pair.leftFile.lines;
    const rightLines = pair.rightFile.lines;

    this.ui.div({
      text: this.c.bold(pair.leftFile.path),
      padding: [1, 1, 1, 1],
    },
    {
      text: this.c.bold(pair.rightFile.path),
      padding: [1, 1, 1, 1],
    });
    this.ui.div({
      text: this.c.bold("Total overlap: ") + pair.overlap.toString() + " kgrams",
      padding: [0, 1, 0, 1],
    });
    this.ui.div({
      text: this.c.bold("Similarity score: ") + pair.similarity.toString(),
      padding: [0, 1, 1, 1],
    });

    const maxLines = Math.max(leftLines.length, rightLines.length);
    const lineNrWidth = Math.trunc(Math.log10(maxLines + 1)) + 2;
    const lineWidth = Math.trunc((this.width - 3) / 2);

    // number lines
    const nl = (i: number): string =>
      this.c.grey((i + 1).toString().padEnd(lineNrWidth));

    const fragments = pair.buildFragments();

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
        text: this.c.bold(`Fragment ${i+1}/${fragments.length}:` +
                         ` ${fragment.leftkgrams.length} kgrams`),
        align: "center",
        padding: [1, 0, 1, 0],
      });

      this.ui.div({
        text: this.c.bold("Tokens: ") + "'" +
              this.c.red(fragment.mergedData) + "'",
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
