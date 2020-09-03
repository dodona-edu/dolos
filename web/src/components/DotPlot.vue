<template>
  <div id="dotplot"></div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Diff } from "@/api/api";
import * as d3 from "d3";

type CellData = { row: number; col: number; value: number};

@Component
export default class DotPlot extends Vue {
  @Prop({ required: true }) diff!: Diff;

  private startColor = "#ffffff";
  private endColor = "#3498db";

  private matrix: Array<Array<number>> = [];

  showPlot(): void {
    this.onDiffChange(this.diff);
    this.drawPlot();
  }

  drawPlot(): void {
    const matrix = this.matrix;

    const numrows = matrix.length;
    const numcols = matrix[0].length;

    const size = 450;
    let width;
    let height;
    if (numcols > numrows) {
      width = size * numrows / numcols;
      height = size;
    } else {
      width = size;
      height = size * numcols / numrows;
    }
    const base = d3.select("#dotplot");
    const chart = base.append("canvas")
      .attr("width", width)
      .attr("height", height);

    const customBase = document.createElement("custom");
    const custom = d3.select(customBase);

    const context = chart.node()?.getContext("2d") as CanvasRenderingContext2D;

    const rowGroups = d3.range(0, numrows);
    const colGroups = d3.range(0, numcols);

    // Build X scales and axis:
    const x = d3.scaleBand()
      .range([0, width])
      // @ts-ignore
      .domain(rowGroups);

    // Build Y scales and axis:
    const y = d3.scaleBand()
      .range([0, height])
      // @ts-ignore
      .domain(colGroups);

    // add the squares
    custom.selectAll("rect")
      .data([...DotPlot.loopSequentiallyOverData(this.matrix)])
      .enter()
      .append("rect")
      // @ts-ignore
      .attr("x", function (d) { return x(d.row); })
      // @ts-ignore
      .attr("y", function (d) { return y(d.col); })
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("fillStyle", function (d: CellData) {
        return d.value === 0 ? "lightgray" : "black";
      });

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);

    custom.selectAll("rect")
      .each(function () {
        // eslint-disable-next-line no-invalid-this
        const node = d3.select(this);
        context.fillStyle = node.attr("fillStyle");
        context.fillRect(
          // @ts-ignore
          node.attr("x"),
          node.attr("y"),
          node.attr("width"),
          node.attr("height")
        );
      });
  }

  private static * loopSequentiallyOverData(matrix: number[][]):
    IterableIterator<CellData> {
    for (const row in matrix) {
      for (const col in matrix[row]) {
        yield { row: +row, col: +col, value: matrix[row][col] };
      }
    }
  }

  mounted(): void {
    this.showPlot();
  }

  updated(): void {
    this.showPlot();
  }

  onDiffChange(diff: Diff | undefined): void {
    if (!diff || !diff.blocks) {
      return;
    }

    const { tokens: leftTokens, locations: leftLocations } = this.getTokensAndLocation(diff.leftFile.ast);
    const { tokens: rightTokens, locations: rightLocations } = this.getTokensAndLocation(diff.rightFile.ast);

    this.matrix = new Array(leftTokens.length)
      .fill([])
      .map(() => new Array(rightTokens.length).fill(0));

    for (const block of diff.blocks) {
      for (const pair of block.pairs) {
        const leftStart = pair.left.start;
        const leftStop = pair.left.stop;
        const rightStart = pair.right.start;
        for (let i = 0; i < leftStop - leftStart; i += 1) {
          if (leftLocations[leftStart + i] === -1) {
            continue;
          }
          this.matrix[leftLocations[leftStart + i]][rightLocations[rightStart + i]] += 1;
        }
      }
    }
  }

  private getTokensAndLocation(astTree: string): {tokens: Array<string>; locations: Array<number>} {
    const tokens: Array<string> = [];
    const locations: Array<number> = new Array(astTree.length).fill(-1);
    let lastToken = "";
    let lastSkipped = 0;
    const window = [];
    const skippedWindow = [];
    let filePos = 0;

    for (const { token, skipped } of this.iterateTokens(astTree)) {
      if (window.length === 1) {
        lastToken = window.shift() as string;
        lastSkipped = skippedWindow.shift() as number;
      }
      filePos += lastToken.length + lastSkipped;
      window.push(token);
      skippedWindow.push(skipped);

      const length = skippedWindow.reduce((p, n) => p + n, 0) +
        window.map(s => s.length).reduce((p, n) => p + n, 0);

      const index = tokens.push(token) - 1;
      for (let i = filePos + skipped; i < filePos + length; i += 1) {
        locations[i] = index;
      }
    }

    return { tokens, locations };
  }

  private * iterateTokens(astTree: string): IterableIterator<{ token: string; skipped: number }> {
    let token = "";
    let skipped = 0;
    for (const char of astTree.split("")) {
      if (char.trim().length === 0) {
        if (token.length > 0) {
          yield { token, skipped };
          token = "";
          skipped = 0;
        }
        skipped += char.length;
      } else {
        if (char === "(" || char === ")") {
          if (token.length !== 0) {
            yield { token, skipped };
            skipped = 0;
            token = "";
          }
          yield { token: char, skipped };
          skipped = 0;
        } else {
          token += char;
        }
      }
    }
    if (token.length !== 0) {
      yield { token, skipped };
    }
  }
}
</script>

<style scoped>

</style>
