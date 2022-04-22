<template>
<div :id="getSvgId()"></div>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import DataView from "@/views/DataView";
import { File, Pair } from "@/api/api";
import * as d3 from "d3";
import { FileInterestingnessCalculator, FileScoring } from "@/util/FileInterestingness";
import { TooltipTool } from "@/d3-tools/TooltipTool";

@Component({})
export default class OverviewBarchart extends DataView {
  @Prop({ default: 50 }) numberOfTicks!: number;
  @Prop() extraLine: undefined | number;
  @Prop({ default: "similarity" }) pairField!: "similarity" | "longestFragment" | "totalOverlap";

  private maxFileData: number[] = [];

  private margin: { left: number; right: number; top: number; bottom: number };
  private width: number;
  private height: number;

  constructor() {
    super();
    this.margin = { top: 10, right: 60, bottom: 50, left: 50 };
    this.width = (document.getElementById(this.getSvgId())?.clientWidth || 750) - this.margin.left - this.margin.right;
    this.height = (document.getElementById(this.getSvgId())?.clientHeight || 400) -
      this.margin.top - this.margin.bottom;
  }

  mounted(): void {
    this.setSize();
    this.afterDataInit();
    document.getElementById(this.getSvgId())!.onresize = () => {
      this.setSize();
      this.afterDataInit();
    };
  }

  async afterDataInit(): Promise<void> {
    await this.ensureData();
    this.maxFileData = this.getMaxFileData();
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
      .range([this.width, 0])
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
      .attr("transform", `translate(${this.width}, 0)`)
      .call(d3.axisRight(xScale));

    rightAxis.append("text")
      .text("Similarity")
      .attr("font-size", 15)
      .attr("fill", "black")
      .attr("transform", `translate(42, ${this.height / 2 + 35}) rotate(-90)`);

    const h = this.width;
    g
      .selectAll("rect")
      .data<d3.Bin<number, number>>(data)
      .enter()
      .append("rect")
      .attr("x", 0)
      .attr("transform", function (d) {
        return "translate(" + yScale(d.length) + "," + xScale(d.x0 || 0) + ")";
      })
      .attr("height", function (d) {
        return xScale(d.x1 || 0) - xScale(d.x0 || 0) - 1;
      })
      .attr("width", function (d) {
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
    const files: File[] = Array.from(Object.values(this.files));
    const pairs = Array.from(Object.values(this.pairs));

    const scoringCalculator = new FileInterestingnessCalculator(pairs);

    const scoredFiles = files.map(file =>
      scoringCalculator.calculateFileScoring(file)
    );

    return scoredFiles.map(f => this.mapScoreToField(f));
  }

  private mapScoreToField(score: FileScoring): number {
    if (this.pairField === "similarity") { return score.similarityScore?.similarity || 0; }

    if (this.pairField === "totalOverlap") { return score.totalOverlapScore?.totalOverlapWrtSize || 0; }

    if (this.pairField === "longestFragment") { return score.longestFragmentScore?.longestFragmentWrtSize || 0; }

    return 0;
  }

  private _svgId: string | null = null;
  getSvgId(): string {
    if (!this._svgId) {
      this._svgId = `svg-file-histogram-${Math.round(Math.random() * 100000)}`;
    }

    return this._svgId;
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

  private setSize(): void {
    this.width = (document.getElementById(this.getSvgId())?.clientWidth || 750) -
      this.margin.left - this.margin.right;
    this.height = (document.getElementById(this.getSvgId())?.clientHeight || 400) -
      this.margin.top - this.margin.bottom;
  }
}
</script>

<style scoped>

</style>
