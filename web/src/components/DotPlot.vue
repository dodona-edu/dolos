<template>
  <div id="dotplot"></div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { Diff } from "@/api/api";
import * as d3 from "d3";

type CellData = { row: number; col: number; value: number};

@Component
export default class DotPlot extends Vue {
  @Prop({ required: true }) diff!: Diff;

  private matrix: Array<Array<number>> = [];

  @Watch("diff", { deep: true })
  onDiffChange(newDiff: Diff): void {
    this.calculateMatrix(newDiff);
    this.drawPlot();
  }

  drawPlot(): void {
    const matrix = this.matrix;
    if (!matrix) {
      return;
    }

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
    const rowGroups = d3.range(0, numrows);
    const colGroups = d3.range(0, numcols);

    // append the svg object to the body of the page
    const svg = d3.select("#dotplot")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("background", "lightgray")
      .append("g");

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
    svg.selectAll()
      .data([...DotPlot.loopSequentiallyOverData(this.matrix)], function (d) { return d?.row + ":" + d?.col; })
      .enter()
      .append("rect")
      // @ts-ignore
      .attr("x", function (d) { return x(d.row); })
      // @ts-ignore
      .attr("y", function (d) { return y(d.col); })
      .attr("width", x.bandwidth() * 4)
      .attr("height", y.bandwidth() * 4)
      .style("fill", function () { return "black"; })
      .style("stroke-width", 4)
      .style("stoke-color", "black")
      .style("stroke", "none");
  }

  private static * loopSequentiallyOverData(matrix: number[][]):
    IterableIterator<CellData> {
    for (const row in matrix) {
      for (const col in matrix[row]) {
        if (matrix[row][col] > 0) {
          yield { row: +row, col: +col, value: matrix[row][col] };
        }
      }
    }
  }

  calculateMatrix(diff: Diff | undefined): void {
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
