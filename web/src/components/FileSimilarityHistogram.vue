<template>
  <div :id="getSvgId()"></div>
</template>

<script lang="ts">
import DataView from "@/views/DataView";
import { Component, Prop } from "vue-property-decorator";
import { pairsAsNestedMapCached } from "@/util/PairAsNestedMap";
import * as d3 from "d3";
import { ScaleBand, ScaleLinear } from "d3";
import { File, Pair } from "@/api/api";

/**
 * Code inspired by https://www.d3-graph-gallery.com/graph/barplot_basic.html
 */
@Component({})
export default class FileSimilarityHistogram extends DataView {
  @Prop() file!: File;

  private height: number;
  private width: number;
  private margin: { top: number; right: number; bottom: number; left: number };

  private svg: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null =
    null;

  private xScale: ScaleBand<number> | null = null;
  private yScale: ScaleLinear<number, number> | null = null;

  constructor() {
    super();
    this.margin = { top: 30, right: 30, bottom: 100, left: 70 };
    this.width = 700 - this.margin.left - this.margin.right;
    this.height = 250 - this.margin.top - this.margin.bottom;
  }

  mounted(): void {
    super.ensureData();
    this.attachSvg();
    this.setupXScale();
    this.setupYScale();
    this.drawBars();
  }

  attachSvg(): void {
    this.margin = { top: 30, right: 30, bottom: 100, left: 70 };
    this.svg = d3
      .select(`#${this.getSvgId()}`)
      .append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr(
        "transform",
        "translate(" + this.margin.left + "," + this.margin.top + ")"
      );
  }

  setupXScale(): void {
    const svg = this.svg;
    if (!svg) return;

    const scaleBand = d3
      .scaleBand<number>()
      .range([0, this.width])
      .domain(this.getData().map(v => v.id))
      .padding(0.2);
    this.xScale = scaleBand;
    svg.append("g")
      .attr("transform", "translate(0," + this.height + ")")
      .call(d3.axisBottom(scaleBand).tickFormat(v => this.getOtherFileName(this.pairs[v])))
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end");
  }

  setupYScale(): void {
    const svg = this.svg;
    if (!svg) return;

    const y = d3.scaleLinear().domain([0, 1]).range([this.height, 0]);
    this.yScale = y;
    svg.append("g").call(d3.axisLeft(y));
  }

  drawBars(): void {
    const [svg, xScale, yScale] = [this.svg, this.xScale, this.yScale];
    if (!svg || !xScale || !yScale) return;

    const colorScale = d3
      .scaleLinear<string, number>()
      .domain([0, 1])
      .range(["white", "#1976D2"]);

    svg.selectAll("mybar")
      .data(this.getData())
      .enter()
      .append("rect")
      .attr("x", d => xScale(d.id) || 0)
      .attr("y", d => yScale(d.similarity) || 0)
      .attr("width", xScale.bandwidth() || 0)
      .attr("height", d => this.height - yScale(d.similarity) || 0)
      .attr("fill", d => colorScale(d.similarity));
  }

  getData(): Pair[] {
    if (!this.dataLoaded) return [];
    const pairMap = pairsAsNestedMapCached(() => Object.values(this.pairs)).get(this.file.id);

    if (!pairMap) return [];

    const candiadateArray = Array.from(
      pairMap
        .values()
    );

    candiadateArray.sort((a, b) => b.similarity - a.similarity);

    return candiadateArray.slice(0, 25);
  }

  private _svgId: string | null = null;
  getSvgId(): string {
    if (!this._svgId) {
      this._svgId = `svg-file-histogram-${Math.round(Math.random() * 100000)}`;
    }

    return this._svgId;
  }

  getOtherFileName(pair: Pair): string {
    const otherFile = this.file.id === pair.leftFile.id ? pair.rightFile : pair.leftFile;

    return otherFile.extra?.fullName || otherFile.path.split("/").splice(-2).join("/");
  }
}
</script>

<style scoped></style>
