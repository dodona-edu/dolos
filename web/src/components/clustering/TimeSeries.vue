<template>
  <div :id="getSvgId()"></div>
</template>
<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { File } from "@/api/api";
import * as d3 from "d3";
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import { getClusterElementsArray } from "@/util/clustering-algorithms/ClusterFunctions";

@Component({})
export default class TimeSeriesDiagram extends Vue {
  @Prop() cluster!: Cluster;

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
    this.initialize();
  }

  private initialize(): void {
    const data = getClusterElementsArray(this.cluster);
    const xScale = this.getXScale(data);
    this.addSVG(xScale, data);
  }

  private getXScale(files:File[]): d3.ScaleTime<number, number> {
    return d3.scaleTime<number, number>()
      .domain(d3.extent(files.map(f => f.extra.timestamp!)) as [Date, Date])
      .range([0, this.width]);
  }

  private addSVG(xScale: d3.ScaleTime<number, number>, data: File[]): void {
    d3.select(`#${this.getSvgId()}`).select("svg").remove();

    const svg = d3.select(`#${this.getSvgId()}`)
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
      .attr("transform", `translate(0, ${this.height / 2})`)
      .call(d3.axisBottom(xScale));

    svg
      .selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("r", 5)
      .attr("cx", d => xScale(d.extra.timestamp!))
      .attr("cy", this.height / 2)
      .attr("fill", "#1976D2");
  }

  private _svgId: string | null = null;

  getSvgId(): string {
    if (!this._svgId) {
      this._svgId = `svg-file-histogram-${Math.round(Math.random() * 100000)}`;
    }
    return this._svgId;
  }
}
</script>
