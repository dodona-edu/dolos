<template>
<div :id="getSvgId()"></div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import DataView from "@/views/DataView";
import { File } from "@/api/api";
import * as d3 from "d3";
import { FileInterestingnessCalculator, FileScoring } from "@/util/FileInterestingness";
import { TooltipTool } from "@/d3-tools/TooltipTool";
import { ResizableD3Viz } from "@/d3-tools/ResizableD3Viz";

@Component({})
export default class OverviewBarchart extends ResizableD3Viz {
  @Prop({ default: 50 }) numberOfTicks!: number;
  @Prop() extraLine: undefined | number;
  @Prop({ default: "similarity" }) pairField!: "similarity" | "longestFragment" | "totalOverlap";

  private maxFileData: number[] = [];

  private margin: { left: number; right: number; top: number; bottom: number };
  private width: number;
  private height: number;

  private xScale?: any;

  constructor() {
    super();
    this.margin = { top: 10, right: 40, bottom: 50, left: 70 };
    this.width = (document.getElementById(this.getSvgId())?.clientWidth || 600) - this.margin.left - this.margin.right;
    this.height = (document.getElementById(this.getSvgId())?.clientHeight || 400) -
      this.margin.top - this.margin.bottom;
  }

  mounted(): void {
    super.mounted();
  }

  async initialize(): Promise<void> {
    this.maxFileData = await this.getMaxFileData();
    this.draw();
  }

  resize(): void {
    this.setSize();
    this.draw();
  }

  draw(): void {
    const xScale = this.getXScale();
    this.xScale = xScale;
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
  }

  private getXScale(): d3.ScaleLinear<number, number> {
    const xScale = d3
      .scaleLinear()
      .domain([0, 1] as [number, number])
      .range([0, this.height]);

    return xScale;
  }

  private getYScale(
    bins: d3.Bin<number, number>[]
  ): d3.ScaleLinear<number, number> {
    const yScale = d3
      .scaleLinear()
      .range([0, this.width])
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

    const bottomAxis = g
      .append("g")
      .attr("transform", "translate(0," + this.height + ")")
      .call(d3.axisBottom(yScale));

    bottomAxis.append("text")
      .text("Amount of pairs")
      .attr("font-size", 15)
      .attr("fill", "black")
      .attr("transform", `translate(${this.width / 2}, 35)`);

    const rightAxis = g.append("g")
      .attr("transform", "translate(0, 0)")
      .call(d3.axisLeft(xScale));

    rightAxis.append("text")
      .text("Similarity")
      .attr("font-size", 15)
      .attr("fill", "black")
      .attr("transform", `translate(-50, ${this.height / 2 + 35}) rotate(90)`);

    const h = this.width;
    g
      .selectAll("rect")
      .data<d3.Bin<number, number>>(data)
      .enter()
      .append("rect")
      .attr("x", 0)
      .attr("transform", function (d) {
        return "translate(" + 0 + "," + xScale(d.x0 || 0) + ")";
      })
      .attr("height", function (d) {
        return xScale(d.x1 || 0) - xScale(d.x0 || 0) - 1;
      })
      .attr("width", function (d) {
        return yScale(d.length);
      })
      .style("fill", d => this.getBinColor(d));

    if (this.extraLine !== undefined) {
      g
        .append("line")
        .attr("class", "extra-line")
        .attr("x1", 0)
        .attr("y1", xScale(this.extraLine))
        .attr("x2", this.width)
        .attr("y2", xScale(this.extraLine))
        .attr("stroke", "black");
    }

    return svg;
  }

  async getMaxFileData(): Promise<number[]> {
    const files: File[] = Array.from(Object.values(this.files));
    const pairs = Array.from(Object.values(this.pairs));

    const scoringCalculator = new FileInterestingnessCalculator(pairs, this.$store);

    const scoredFiles = await Promise.all(files.map(async (file) =>
      await scoringCalculator.calculateFileScoring(file)
    ));

    return scoredFiles.map(f => this.mapScoreToField(f));
  }

  private mapScoreToField(score: FileScoring): number {
    if (this.pairField === "similarity") { return score.similarityScore?.similarity || 0; }

    if (this.pairField === "totalOverlap") { return score.totalOverlapScore?.totalOverlapWrtSize || 0; }

    if (this.pairField === "longestFragment") { return score.longestFragmentScore?.longestFragmentWrtSize || 0; }

    return 0;
  }

  @Watch("extraLine")
  updateExtraline(): void {
    if (this.xScale) {
      d3.select(`#${this.getSvgId()}`).select("svg").select(".extra-line")
        .attr("y1", this.xScale(this.extraLine))
        .attr("y2", this.xScale(this.extraLine));
    }
  }

  private _svgId: string | null = null;
  getSvgId(): string {
    if (!this._svgId) {
      this._svgId = `svg-file-histogram-${Math.round(Math.random() * 100000)}`;
    }

    return this._svgId;
  }

  getBinColor(d: d3.Bin<number, number>): string {
    return "#1976D2";
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

  private setSize(): void {
    this.width = (document.getElementById(this.getSvgId())?.clientWidth || 600) -
      this.margin.left - this.margin.right;
    this.height = 400 -
      this.margin.top - this.margin.bottom;
  }
}
</script>

<style scoped>

</style>
