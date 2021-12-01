<template>
  <div :id="getSvgId()"></div>
</template>
<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import { Pair, File } from "@/api/api";
import { pairsAsNestedMap } from "@/util/PairAsNestedMap";
import * as d3 from "d3";

import DataView from "@/views/DataView";

@Component({})
export default class SimilarityHistogram extends DataView {
  @Prop({ default: 50 }) numberOfTicks!: number;
  @Prop() extraLine: undefined | number;

  private maxFileData: number[] = [];

  private margin: { left: number; right: number; top: number; bottom: number };
  private width: number;
  private height: number;

  constructor() {
    super();
    this.margin = { top: 10, right: 30, bottom: 30, left: 40 };
    this.width = 750 - this.margin.left - this.margin.right;
    this.height = 400 - this.margin.top - this.margin.bottom;
  }

  mounted(): void {
    this.afterDataInit();
  }

  async afterDataInit(): Promise<void> {
    await this.ensureData();
    this.maxFileData = this.getMaxFileData();
    const xScale = this.getXScale();
    const histogram = d3
      .bin()
      .domain(xScale.domain() as [number, number])
      .thresholds(xScale.ticks(this.numberOfTicks));
    const bins = histogram(this.maxFileData);
    const yScale = this.getYScale(bins);

    this.addSVG(xScale, yScale, bins);
  }

  private getXScale(): d3.ScaleLinear<number, number> {
    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(this.maxFileData)] as [number, number])
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
  ): void {
    d3.select(`#${this.getSvgId()}`).select("svg").remove();
    const svg = d3
      .select(`#${this.getSvgId()}`)
      .append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr(
        "transform",
        "translate(" + this.margin.left + "," + this.margin.top + ")"
      );

    svg
      .append("g")
      .attr("transform", "translate(0," + this.height + ")")
      .call(d3.axisBottom(xScale));

    svg.append("g").call(d3.axisLeft(yScale));

    const h = this.height;
    svg
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
      svg
        .append("line")
        .attr("x1", xScale(this.extraLine))
        .attr("y1", 0)
        .attr("x2", xScale(this.extraLine))
        .attr("y2", this.height)
        .attr("stroke", "black");
    }
  }

  getMaxFileData(): number[] {
    const files: File[] = Array.from(Object.values(this.files));
    const pairMap = pairsAsNestedMap(Object.values(this.pairs));

    const maxFunction = (a: number, b: number): number => (a > b ? a : b);
    const getPairs = (f: File): Pair[] =>
      Array.from(pairMap.get(f.id)?.values() || []);
    const maxFileData = files.map((f: File) =>
      getPairs(f)
        .map((p: Pair) => p.similarity)
        .reduce(maxFunction, 0)
    );

    return maxFileData;
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
}
</script>
<style scoped>
</style>
