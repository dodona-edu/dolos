<template>
  <div>
    <h2>Heatmap</h2>
    <div class="d-flex flex-column align-center flex-grow flex-nowrap">
      <v-alert color="#1976D2" v-if="!hoveredPair" class="extra-info-container" type="info"
        >Hover over a pair to see extra data.</v-alert
      >

      <v-alert
        v-if="!!hoveredPair"
        color="#1976D2"
        class="extra-info-container"
        type="info"
      >
        <span>Similarity: {{ hoveredPair.similarity.toFixed(2) }}</span>
        <span>Longest fragment: {{ hoveredPair.longestFragment }}</span>
        <span>Common overlap: {{ hoveredPair.totalOverlap }}</span>
      </v-alert>
      <div :id="svgId" class="svg-container"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Watch, Prop } from "vue-property-decorator";
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import DataView from "@/views/DataView";

import * as d3 from "d3";
import { ScaleBand, ScaleLinear } from "d3";
import { getClusterElementsArray, getClusterElementsSorted } from "@/util/clustering-algorithms/ClusterFunctions";
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

  private scale = 1.2;

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
    const topBottomMargin = 100;
    const leftRightMargin = 300;

    this.svg = d3
      .select(`#${this.svgId}`)
      .append("svg")
      .attr("width", width + 2 * leftRightMargin)
      .attr("height", height + 2 * topBottomMargin)
      .append("g")
      .attr(
        "transform",
        `translate(${leftRightMargin}, ${topBottomMargin / 2})`
      );
  }

  private initializeAxes(): void {
    const [width, height] = this.dimensions;
    const elements = getClusterElementsSorted(this.cluster);

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

    const xAxis = d3
      .axisBottom(this.xBand)
      .tickFormat(
        (d) =>
          `${
            this.files[d].extra.fullName ||
            this.files[d].path.split("/").slice(-1).join("")
          }`
      );

    this.svg
      ?.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-35)");

    const yAxis = d3
      .axisLeft(this.yBand)
      .tickFormat(
        (d) =>
          `${
            this.files[d].extra.fullName ||
            this.files[d].path.split("/").slice(-1).join("")
          }`
      );

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
        ([first, second]) => this.getPair(first, second)?.similarity || 1
      )
      .attr("class", "square-element")
      .style("fill", ([first, second]) =>
        colorScale(this.getPair(first, second)?.similarity || 1)
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
    const [xBand, yBand] = [this.xBand, this.yBand];

    if (!xBand || !yBand) {
      return;
    }

    d3.select<any, [File, File]>(event?.currentTarget)
      .attr("width", xBand.bandwidth() * this.scale)
      .attr("height", yBand.bandwidth() * this.scale)
      .attr(
        "x",
        ([first]) =>
          (xBand(first.id) || 0) +
          (xBand.bandwidth() - xBand.bandwidth() * this.scale) / 2
      )
      .attr(
        "y",
        ([, second]) =>
          (yBand(second.id) || 0) +
          (yBand.bandwidth() - yBand.bandwidth() * this.scale) / 2
      )
      .raise();

    const pair = this.getPair(first, second);
    this.hoveredPair = pair;
  }

  private onLeave(_: unknown, [first, second]: [File, File]): void {
    const [xBand, yBand] = [this.xBand, this.yBand];

    if (xBand === null || yBand === null) {
      return;
    }

    this.hoveredPair = null;

    d3.select<any, [File, File]>(event?.currentTarget as any)
      .attr("width", xBand.bandwidth())
      .attr("height", yBand.bandwidth())
      .attr("x", ([first]) => xBand(first.id) || 0)
      .attr("y", ([, second]) => yBand(second.id) || 0)
      .lower();
  }
}
</script>

<style scoped>
div {
  pointer-events: auto;
}

.svg-container {
  display: flex;
  flex-direction: row;
  justify-content: center;
  min-width: 650px;
}

.extra-info-container {
  min-width: 600px;
  width: 60%;
  color: white;
}
</style>

non-scoped style for svg styles
<style>
.square-element {
  cursor: pointer;
}

.extra-info-container * * {
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  text-align: center;
}
</style>
