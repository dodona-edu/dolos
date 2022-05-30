<template>
  <div>
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
      <div class="d-flex flex-row justify-space-around fullwidth">
        <div class="gel-list">
          <GraphElementList :selected-files="selectedFiles"  :cluster="cluster"></GraphElementList>
        </div>
        <div class="d-flex">
          <div :id="svgId" class="svg-container"></div>
          <div :id="`${svgId}-legend`"></div>
        </div>
      </div>
    </div>
    <div class="more-info">
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-icon v-bind="attrs" v-on="on">
            mdi-information
          </v-icon>
        </template>
        <span class="tooltip-span">
        The heatmap visualizes the details of each of the pairs of files in this cluster. You can use this to examine
          the connections between the files in detail. This can be useful in particular for identifying files which
          do not belong in the cluster, when certain rows and columns are colored too light. You can use this to modify
          the cutoff value.
          </span>
      </v-tooltip>
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
import GraphElementList from "@/d3-tools/GraphElementList.vue";
@Component({
  components: { GraphElementList }
})
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

  private selectedFiles: File[] = [];

  async mounted(): Promise<void> {
    await this.ensureData();
    this.initialize();
  }

  @Watch("cluster")
  redraw(): void {
    d3.select(`#${this.svgId}`).selectAll("svg").remove();
    d3.select(`#${this.svgId}-legend`).selectAll("svg").remove();
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
    const leftMargin = 125;
    const rightMargin = 30;

    this.svg = d3
      .select(`#${this.svgId}`)
      .append("svg")
      .attr("width", width + leftMargin + rightMargin)
      .attr("height", height + 2 * topBottomMargin)
      .append("g")
      .attr(
        "transform",
        `translate(${leftMargin}, ${topBottomMargin / 2})`
      );
  }

  private initializeAxes(): void {
    const [width, height] = this.dimensions;
    const elements = getClusterElementsSorted(this.cluster);

    this.xBand = d3
      .scaleBand<number>()
      .range([0, width])
      .domain(elements.map(d => d.id).reverse())
      .padding(0.01);

    this.yBand = d3
      .scaleBand<number>()
      .range([height, 0])
      .domain(elements.map(d => d.id))
      .padding(0.01);

    const xAxis = d3
      .axisBottom(this.xBand)
      .tickFormat(
        d =>
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
        d =>
          `${
            this.files[d].extra.fullName ||
            this.files[d].path.split("/").slice(-1).join("")
          }`
      );

    this.svg?.append("g").call(yAxis);
  }

  private initializeColorScale(): void {
    const scale = ["#e6f2ff", "#1976D2"];

    this.colorScale = d3
      .scaleLinear<string, number>()
      .domain([this.cutoff, 1])
      .range(scale);

    // Legend code inspired by https://bl.ocks.org/starcalibre/6cccfa843ed254aa0a0d

    const legendSvg = d3.select(`#${this.svgId}-legend`)
      .append("svg")
      .attr("width", 50)
      .attr("height", 300)
      .append("g").attr("transform", "rotate(-90) translate(-250, 0)");

    const gradient = legendSvg.append("defs")
      .append("linearGradient")
      .attr("id", "gradient")
      .attr("x1", "0%") // bottom
      .attr("y1", "0%")
      .attr("x2", "100%") // to top
      .attr("y2", "0%")
      .attr("spreadMethod", "pad");

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", scale[0])
      .attr("stop-opacity", 1);

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", scale[1])
      .attr("stop-opacity", 1);

    legendSvg.append("rect")
      .attr("x1", 100)
      .attr("y1", 0)
      .attr("width", 200)
      .attr("height", 25)
      .style("fill", "url(#gradient)");

    const legendScale = d3.scaleLinear()
      .domain([this.cutoff, 1])
      .range([0, 200]);

    const legendAxis = d3.axisBottom(legendScale).tickValues([this.cutoff, 1]);

    const g = legendSvg.append("g")
      .attr("class", "legend axis")
      .attr("transform", "translate(" + 0 + ", 30)")
      .call(legendAxis);

    legendSvg.append("text")
      .attr("class", "x label")
      .attr("text-anchor", "end")
      .attr("x", 175)
      .attr("y", 50)
      .attr("font-size", 15)
      .text("Similarity cutoff value");
  }

  @Watch("cluster")
  private initializeData(): void {
    const elements = getClusterElementsArray(this.cluster);
    const pairs = d3.cross(elements, elements.reverse());

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
    if (pair) {
      this.selectedFiles = [pair.leftFile, pair.rightFile];
    }
    this.hoveredPair = pair;
  }

  private onLeave(_: unknown, [first, second]: [File, File]): void {
    const [xBand, yBand] = [this.xBand, this.yBand];

    if (xBand === null || yBand === null) {
      return;
    }

    this.hoveredPair = null;
    this.selectedFiles = [];

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
  min-width: 400px;
}

.extra-info-container {
  min-width: 400px;
  width: 60%;
  color: white;
}

.gel-list {
  min-width: 400px;
  max-height: 570px;
}

.fullwidth {
  width: 100%;
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

.more-info {
  position: absolute;
  right: 0;
  top: 0;
}

.tooltip-span {
  display: block;
  max-width: 400px;
}
</style>
