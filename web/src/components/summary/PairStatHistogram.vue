
<template>
  <div class="svg-container" :id="getSvgId()"></div>
</template>
<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import * as d3 from "d3";

import { TooltipTool } from "@/d3-tools/TooltipTool";
import { FileScoring } from "@/util/FileInterestingness";
import { ResizableD3Viz } from "@/d3-tools/ResizableD3Viz";

@Component({})
export default class PairStatHistogram extends ResizableD3Viz {
  @Prop({ default: 50 }) numberOfTicks!: number;
  @Prop() extraLine: undefined | number;
  @Prop({ default: "similarity" }) pairField!: "similarity" | "longestFragment" | "totalOverlap";
  @Prop({ required: true }) scoredFiles!: FileScoring[];

  private maxFileData: number[] = [];

  private margin: { left: number; right: number; top: number; bottom: number };
  private width: number;
  private height: number;
  static x = 0;

  constructor() {
    super();
    this.margin = { top: 10, right: 30, bottom: 30, left: 40 };
    this.width = document.getElementById(this.getSvgId())?.clientWidth || 750 - this.margin.left - this.margin.right;
    this.height = document.getElementById(this.getSvgId())?.clientHeight || 400 - this.margin.top - this.margin.bottom;
  }

  initialize(): void {
    this.setSize();
    this.maxFileData = this.getMaxFileData();
    this.draw();
  }

  resize(width: number, height: number): void {
    if ((this.height + this.margin.top + this.margin.bottom) !== height) {
      this.setSize();
      this.draw();
    }
  }

  mounted(): void {
    super.mounted();
  }

  draw(): void {
    const xScale = this.getXScale();
    const domain = xScale.domain();
    const ticks = xScale.ticks(this.numberOfTicks);
    const adjustedTicks = ticks[ticks.length - 1] === domain[1] ? ticks.slice(0, -1) : ticks;
    const histogram = d3
      .bin()
      .domain([0, 1])
      .thresholds(adjustedTicks);
    const bins = histogram(this.maxFileData);
    const yScale = this.getYScale(bins);

    const svg = this.addSVG(xScale, yScale, bins);
    this.addTooltipTool(svg, yScale);
    this.addLine(svg, xScale);
  }

  private getXScale(): d3.ScaleLinear<number, number> {
    const xScale = d3
      .scaleLinear()
      .domain([0, 1] as [number, number])
      .range([0, this.width]);

    return xScale;
  }

  private getYScale(
    bins: d3.Bin<number, number>[]
  ): d3.ScaleLinear<number, number> {
    const yScale = d3
      .scaleLinear()
      .range([this.height, 0])
      .domain([
        0,
        d3.max<d3.Bin<number, number>, number>(bins, ({ length }) => length),
      ] as number[]);
    return yScale;
  }

  private addSVG(
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    data: d3.Bin<number, number>[]
  ): d3.Selection<any, unknown, HTMLElement, any> {
    d3.select(`#${this.getSvgId()}`).select("svg").remove();

    const svg = d3
      .select(`#${this.getSvgId()}`)
      .append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom);
    const g = svg.append("g")
      .attr(
        "transform",
        "translate(" + this.margin.left + "," + this.margin.top + ")"
      );
    g
      .append("g")
      .attr("transform", "translate(0," + this.height + ")")
      .call(d3.axisBottom(xScale));
    g.append("g").call(d3.axisLeft(yScale));
    const h = this.height;
    g
      .selectAll("rect")
      .data<d3.Bin<number, number>>(data)
      .enter()
      .append("rect")
      .attr("x", 1)
      .attr("transform", function (d) {
        return "translate(" + xScale(d.x0 || 0) + "," + yScale(d.length) + ")";
      })
      .attr("width", function (d) {
        return xScale(d.x1 || 0) - xScale(d.x0 || 0) - 1;
      })
      .attr("height", function (d) {
        return h - yScale(d.length);
      })
      .style("fill", d => this.getBinColor(d));
    if (this.extraLine !== undefined) {
      g
        .append("line")
        .attr("x1", xScale(this.extraLine))
        .attr("y1", 0)
        .attr("x2", xScale(this.extraLine))
        .attr("y2", this.height)
        .attr("stroke", "black");
    }
    return svg;
  }

  getMaxFileData(): number[] {
    return this.scoredFiles.map(f => this.mapScoreToField(f));
  }

  private mapScoreToField(score: FileScoring): number {
    if (this.pairField === "similarity") { return score.similarityScore?.similarity || 0; }

    if (this.pairField === "totalOverlap") { return score.totalOverlapScore?.totalOverlapWrtSize || 0; }

    if (this.pairField === "longestFragment") { return score.longestFragmentScore?.longestFragmentWrtSize || 0; }

    return 0;
  }

  getBinColor(d: d3.Bin<number, number>): string {
    const defaultColor = "#1976D2";
    const warningColor = "red";

    if (
      this.extraLine !== undefined &&
      (d.x0 || 0) < this.extraLine &&
      (d.x1 || 0) >= this.extraLine
    ) {
      return warningColor;
    }
    return defaultColor;
  }

  private addTooltipTool(
    svg: d3.Selection<any, unknown, HTMLElement, any>,
    yScale: d3.ScaleLinear<number, number>
  ): void {
    const tool = new TooltipTool<d3.Bin<number, number>>(h => `
      There are <b>${h.length}</b> files that have a value between <b>${h.x0}</b> and <b>${h.x1}</b>
    `);
    svg.select("g")
      .selectAll("rect")
      .on("mouseenter", (e, d) =>
        tool.mouseEnter(e, d as d3.Bin<number, number>, true))
      .on("mouseleave", () => tool.mouseOut());
  }

  private addLine(
    svg: d3.Selection<any, unknown, HTMLElement, any>,
    xScale: d3.ScaleLinear<number, number>
  ): void {
    const line = svg
      .select("g")
      .insert("line", "rect")
      .attr("x1", xScale(0.5))
      .attr("y1", 0)
      .attr("x2", xScale(0.5))
      .attr("y2", this.height)
      .attr("stroke", "black")
      .attr("visibility", "hidden");
    const number = svg.select("g")
      .append("text")
      .attr("x", xScale(0.5))
      .attr("y", this.height + 8)
      .attr("dy", "0.71em")
      .attr("font-size", 15)
      .attr("visibility", "hidden");

    svg.on("mouseenter", () => { line.attr("visibility", "visible"); number.attr("visibility", "visible"); });
    svg.on("mousemove", o => {
      const xCoord = d3.pointer(o)[0] - this.margin.left;
      line.attr("x1", xCoord);
      line.attr("x2", xCoord);
      number.attr("x", xCoord);
      number.text(xScale.invert(xCoord).toFixed(2));
    });
    svg.on("mouseleave", () => { line.attr("visibility", "hidden"); number.attr("visibility", "hidden"); });
  }

  private setSize(): void {
    this.width = (document.getElementById(this.getSvgId())?.clientWidth || 750) -
      this.margin.left - this.margin.right;
    this.height = 400 -
      this.margin.top - this.margin.bottom;
  }
}
</script>
<style scoped>
.svg-container {
  max-height: 500px;
}
</style>
