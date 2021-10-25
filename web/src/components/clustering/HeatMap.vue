<template>
  <div :id="svgId"></div>
</template>

<script lang="ts">
import { Component, Watch, Prop } from "vue-property-decorator";
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import DataView from "@/views/DataView";

import * as d3 from "d3";
import { ScaleBand, ScaleLinear } from "d3";
import { getClusterElementsArray } from "@/util/clustering-algorithms/ClusterFunctions";
import { Pair } from "@/api/api";

@Component
export default class HeatMap extends DataView {
  @Prop() cluster!: Cluster;

  private svgId = `heatmap_${Math.round(Math.random() * 10000)}`;
  private svg: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null =
    null;

  private xBand: ScaleBand<number> | null = null;
  private yBand: ScaleBand<number> | null = null;
  private colorScale: ScaleLinear<string, number> | null = null;

  private dimensions = [450, 450];

  async mounted(): Promise<void> {
    await this.ensureData();
    this.initialize();
  }

  @Watch("cluster")
  redraw(): void {
    d3.select(`#${this.svgId}`).select("svg").remove();
    this.initialize();
  }

  private initialize(): void {
    this.initializeSvg();
    this.initializeAxes();
    this.initializeColorScale();
    this.initializeData();
  }

  private initializeSvg(): void {
    const [width, height] = this.dimensions;
    const margin = 30;
    this.svg = d3
      .select(`#${this.svgId}`)
      .append("svg")
      .attr("width", width + 2 * margin)
      .attr("height", height + 2 * margin)
      .append("g")
      .attr("transform", `translate(${margin}, ${margin})`);
  }

  private initializeAxes(): void {
    const [width, height] = this.dimensions;
    const elements = getClusterElementsArray(this.cluster);

    this.xBand = d3
      .scaleBand<number>()
      .range([0, width])
      .domain(elements.map((f) => f.id))
      .padding(0.01);

    this.yBand = d3
      .scaleBand<number>()
      .range([height, 0])
      .domain(elements.map((f) => f.id))
      .padding(0.01);

    this.svg
      ?.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(this.xBand));

    this.svg?.append("g").call(d3.axisLeft(this.yBand));
  }

  private initializeColorScale(): void {
    this.colorScale = d3
      .scaleLinear<string, number>()
      .domain([0, 1])
      .range(["white", "#69b3a2"]);
  }

  @Watch("cluster")
  private initializeData(): void {
    const elements = getClusterElementsArray(this.cluster).map((f) => f.id);
    const pairs = d3.cross(elements, elements);

    const [xBand, yBand, colorScale] = [
      this.xBand,
      this.yBand,
      this.colorScale,
    ];

    if (xBand === null || yBand === null || colorScale === null) {
      return;
    }

    this.svg
      ?.selectAll()
      .data(pairs)
      .enter()
      .append("rect")
      .attr("x", ([first]) => xBand(first) || 0)
      .attr("y", ([, second]) => yBand(second) || 0)
      .attr("width", xBand.bandwidth())
      .attr("height", yBand.bandwidth())
      .attr(
        "x-content",
        ([first, second]) => this.getPair(first, second)?.similarity || 0
      )
      .style("fill", ([first, second]) =>
        colorScale(this.getPair(first, second)?.similarity || 0)
      )
      .on("click", this.click.bind(this));
  }

  private getPair(fileId1: number, fileId2: number): Pair | null {
    const allPairs = super.pairs as { [s: string]: Pair };

    return (
      Array.from(Object.values<Pair>(allPairs)).find(
        (pair: Pair) =>
          (pair.leftFile.id === fileId1 && pair.rightFile.id === fileId2) ||
          (pair.leftFile.id === fileId2 && pair.rightFile.id === fileId1)
      ) || null
    );
  }

  private click(_: any, [first, second]: [number, number]): void {
    const pair = this.getPair(first, second);

    if (pair) {
      this.$router.push(`/compare/${pair.id}`);
    }
  }
}
</script>

<style scoped>
div {
  cursor: pointer;
  pointer-events: auto;
}
</style>
