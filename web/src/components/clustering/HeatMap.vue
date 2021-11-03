<template>
  <div>
    <h2>Heatmap</h2>
    <div class="d-flex justify-space-between flex-grow flex-nowrap">
      <div :id="svgId" class="svg-container"></div>
      <div v-if="hoveredPair">
        <div class="d-flex">
          <v-icon>mdi-chevron-right</v-icon>
          <h3>Files</h3>
        </div>
        <ul class="d-flex flex-wrap justify-space-between">
          <v-list-item class="file-element">
            <v-icon>mdi-menu-right</v-icon>

            <v-list-item-title>{{
              hoveredPair.leftFile.path.split("/").slice(-2).join("/")
            }}</v-list-item-title>
          </v-list-item>
          <v-list-item class="file-element">
            <v-icon>mdi-menu-right</v-icon>

            <v-list-item-title>{{
              hoveredPair.rightFile.path.split("/").slice(-2).join("/")
            }}</v-list-item-title>
          </v-list-item>
        </ul>

        <div class="d-flex">
          <v-icon>mdi-chevron-right</v-icon>
          <h3>Similarity</h3>
        </div>
        <ul class="d-flex flex-wrap justify-space-between">
          <v-list-item class="file-element">
            <v-icon>mdi-menu-right</v-icon>

            <v-list-item-title
              >Similarity between these files:
              {{ Math.round(hoveredPair.similarity * 100) }}%
            </v-list-item-title>
          </v-list-item>
        </ul>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Watch, Prop } from "vue-property-decorator";
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import DataView from "@/views/DataView";

import * as d3 from "d3";
import { ScaleBand, ScaleLinear } from "d3";
import { getClusterElementsArray } from "@/util/clustering-algorithms/ClusterFunctions";
import { pairsAsNestedMap } from "@/util/PairAsNestedMap";

import { File, Pair } from "@/api/api";

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

  private hoveredPair: Pair | null = null;
  private pairMap: Map<number, Map<number, Pair>> | null = null;

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
    const margin = 100;
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
      .domain(elements.map((d) => d.id))
      .padding(0.01);

    this.yBand = d3
      .scaleBand<number>()
      .range([height, 0])
      .domain(elements.map((d) => d.id))
      .padding(0.01);

    const xAxis = d3.axisBottom(this.xBand).tickFormat(() => "");

    this.svg
      ?.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-65)");

    const yAxis = d3.axisLeft(this.yBand).tickFormat(() => "");

    this.svg?.append("g").call(yAxis);
  }

  private initializeColorScale(): void {
    this.colorScale = d3
      .scaleLinear<string, number>()
      .domain([0, 1])
      .range(["white", "#1976D2"]);
  }

  @Watch("cluster")
  private initializeData(): void {
    const elements = getClusterElementsArray(this.cluster);
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
      .attr("x", ([first]) => xBand(first.id) || 0)
      .attr("y", ([, second]) => yBand(second.id) || 0)
      .attr("width", xBand.bandwidth())
      .attr("height", yBand.bandwidth())
      .attr(
        "x-content",
        ([first, second]) => this.getPair(first, second)?.similarity || 0
      )
      .style("fill", ([first, second]) =>
        colorScale(this.getPair(first, second)?.similarity || 0)
      )
      .on("click", this.click.bind(this))
      .on("mouseover", this.onEnter.bind(this))
      .on("mouseout", this.onLeave.bind(this));
  }

  private getPair(fileId1: File, fileId2: File): Pair | null {
    if (!this.pairMap) {
      this.pairMap = pairsAsNestedMap(Object.values(super.pairs));
    }

    return this.pairMap.get(fileId1.id)?.get(fileId2.id) || null;
  }

  private click(_: any, [first, second]: [File, File]): void {
    const pair = this.getPair(first, second);

    if (pair) {
      this.$router.push(`/compare/${pair.id}`);
    }
  }

  private onEnter(_: unknown, [first, second]: [File, File]): void {
    const pair = this.getPair(first, second);
    console.log(pair);
    this.hoveredPair = pair;
  }

  private onLeave(): void {
    this.hoveredPair = null;
  }
}
</script>

<style scoped>
div {
  cursor: pointer;
  pointer-events: auto;
}
.svg-container {
  display: flex;
  flex-direction: row;
  justify-content: center;
  min-width: 650px;
}
</style>
