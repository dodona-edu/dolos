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
    const margin = { top: 0, right: 0, bottom: 0, left: 0 };
    const width = 450 - margin.left - margin.right;
    const height = 450 - margin.top - margin.bottom;

    const matrix = this.matrix;
    // Read the data
    // Labels of row and columns -> unique identifier of the column called 'group' and 'variable'
    const maxValue = d3.max(matrix, function (layer) { return d3.max(layer, function (d) { return d; }); }) as number;
    const minValue = d3.min(matrix, function (layer) { return d3.min(layer, function (d) { return d; }); }) as number;

    const numrows = matrix.length;
    const numcols = matrix[0].length;
    console.log(numrows, numcols);

    const svg = d3.select("#dotplot").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    console.log("svg");
    const background = svg.append("rect")
      .style("stroke", "black")
      .style("stroke-width", "2px")
      .attr("width", width)
      .attr("height", height);

    const x = d3.scaleOrdinal()
      // @ts-ignore
      .domain(d3.range(0, numcols))
      .range(d3.range(0, width));

    const y = d3.scaleOrdinal()
      // @ts-ignore
      .domain(d3.range(0, numrows))
      // @ts-ignore
      .range(d3.range(0, height));

    const colorMap = d3.scaleLinear()
      .domain([minValue, maxValue])
      // @ts-ignore
      .range([this.startColor, this.endColor]);

    const row = svg.selectAll(".row")
      .data(matrix)
      .enter().append("g")
      .attr("class", "row")
      // @ts-ignore
      .attr("transform", function (d, i) { return "translate(0," + y(i) + ")"; });

    // const cell = row.selectAll(".cell")
    //   .data(function (d) { return d; })
    //   .enter().append("g")
    //   .attr("class", "cell")
    //   // @ts-ignore
    //   .attr("transform", function (d, i) { return "translate(" + x(i) + ", 0)"; });
    //
    // cell.append("rect")
    //   .attr("width", 450)
    //   .attr("height", 450)
    //   .style("stroke-width", 0);
    //
    // cell.append("text")
    //   .attr("dy", ".32em")
    //   .attr("x", 450 / 2)
    //   .attr("y", 450 / 2)
    //   .attr("text-anchor", "middle")
    //   .style("fill", function (d, i) { return d >= maxValue / 2 ? "white" : "black"; })
    //   .text(function (d, i) { return d; });
    //
    // row.selectAll(".cell")
    //   .data(function (d, i) { return matrix[i]; })
    //   .style("fill", colorMap);
    // console.log("done drawing");
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
