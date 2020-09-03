<template>
  <div id="dotplot"></div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Diff } from "@/api/api";
import * as d3 from "d3";

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
    console.log("drawing plot");
    // const margin = { top: 0, right: 0, bottom: 0, left: 0 };
    // const width = 450 - margin.left - margin.right;
    // const height = 450 - margin.top - margin.bottom;

    const matrix = this.matrix;
    // Read the data
    // Labels of row and columns -> unique identifier of the column called 'group' and 'variable'
    const maxValue = d3.max(matrix, function (layer) { return d3.max(layer, function (d) { return d; }); }) as number;
    const minValue = d3.min(matrix, function (layer) { return d3.min(layer, function (d) { return d; }); }) as number;

    const numrows = matrix.length;
    const numcols = matrix[0].length;

    const size = 450;
    const width = size;
    const height = size;

    console.log(height, width, numrows, numcols, height / width, numrows / numcols);
    const base = d3.select("#dotplot");
    const chart = base.append("canvas")
      .attr("width", width)
      .attr("height", height);

    const customBase = document.createElement("custom");
    const custom = d3.select(customBase); // this is our svg replacement

    const context = chart.node()?.getContext("2d") as CanvasRenderingContext2D;
    // Read the data

    // Labels of row and columns -> unique identifier of the column called 'group' and 'variable'
    const myGroups = d3.range(0, numrows);
    const myVars = d3.range(0, numcols);
    // const myGroups = d3.map(data, function (d) { return d.group; }).keys();
    // const myVars = d3.map(data, function (d) { return d.variable; }).keys();

    // Build X scales and axis:
    const x = d3.scaleBand()
      .range([0, width])
      // @ts-ignore
      .domain(myGroups);
    // svg.append("g")
    //   .style("font-size", 15)
    //   .attr("transform", "translate(0," + height + ")")
    //   .call(d3.axisBottom(x).tickSize(0))
    //   .select(".domain").remove();

    // Build Y scales and axis:
    const y = d3.scaleBand()
      .range([0, height])
      // @ts-ignore
      .domain(myVars);
    // svg.append("g")
    //   .style("font-size", 15)
    //   .call(d3.axisLeft(y).tickSize(0))
    //   .select(".domain").remove();

    // Build color scale
    const myColor = d3.scaleSequential(d3.interpolateInferno)
      .domain([minValue, maxValue]);

    // Three function that change the tooltip when user hover / move / leave a cell

    // add the squares
    custom.selectAll("rect")
      .data([...this.loopSequentiallyOverData(this.matrix)], function (d: any) { return d?.row + ":" + d?.col; })
      .enter()
      .append("rect")
      // @ts-ignore
      .attr("x", function (d) { return x(d.row); })
      // @ts-ignore
      .attr("y", function (d) { return y(d.col); })
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("fillStyle", function (d) { return d.value === 0 ? "lightgray" : myColor(d.value); });

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);

    custom.selectAll("rect")
      .each(function (d: any, i) {
        if (d.value !== 0) {
          console.log(d);
        }
        // eslint-disable-next-line no-invalid-this
        const node = d3.select(this);
        context.fillStyle = node.attr("fillStyle");
        context.fillRect(
          +node.attr("x"),
          +node.attr("y"),
          +node.attr("width"),
          +node.attr("height")
        );
      });
  }

  private * loopSequentiallyOverData(matrix: number[][]): IterableIterator<{ row: number; col: number; value: number}> {
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
