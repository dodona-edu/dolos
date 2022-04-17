<template>
  <div :id="svgId">

  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import { File } from "@/api/api";
import DataView, { Legend } from "@/views/DataView";
import * as d3 from "d3";

type SVGSelection = d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>;
type WidthScale = d3.ScaleLinear<number, number>;

@Component({})
export default class FileTagList extends DataView {
  @Prop({ required: true }) currentFiles!: File[];
  private svgId = `file_tag_list_${Math.round(Math.random() * 10000)}`;

  private idealElementWidth = 46;
  private elementMargin = 6;

  private width = 870;
  private height = 40;
  private legend: Legend | null = null;

  mounted(): void {
    this.initialize();
  }

  @Watch("currentFiles")
  initialize(): void {
    this.legend = this.createLegend();
    const svg = this.initializeSvg();
    const scale = this.createScale();
    this.addSvgElements(svg, scale);
  }

  initializeSvg(): SVGSelection {
    d3.select(`#${this.svgId}`).selectAll("svg").remove();
    return d3.select(`#${this.svgId}`).append("svg")
      .attr("width", this.width).attr("height", this.height);
  }

  createScale(): WidthScale {
    const necessaryWidthWithoutOverlap = this.idealElementWidth * this.currentFiles.length;
    const actualWidth = Math.min(necessaryWidthWithoutOverlap, this.width - this.idealElementWidth);

    return d3.scaleLinear()
      .domain([0, this.currentFiles.length])
      .range([0, actualWidth]);
  }

  addSvgElements(svg: SVGSelection, scale: WidthScale): void {
    const groups = svg
      .append("g")
      .attr("transform",
        `translate(${this.idealElementWidth / 2}, ${(this.idealElementWidth - this.elementMargin) / 2})`)
      .selectAll("g")
      .data(this.currentFiles)
      .enter()
      .append("g")
      .attr("transform", (_, i) => `translate(${scale(i)}, 0)`);

    groups.append("circle")
      .attr("r", 20)
      .attr("fill", v => this.getColor(v));

    groups.append("text")
      .text(f => this.getInitials(f))
      .attr("stroke", "white")
      .attr("fill", "white")
      .attr("text-anchor", "middle")
      .attr("dy", "0.3em");

    groups.on("mouseenter", function () {
      // eslint-disable-next-line no-invalid-this
      d3.select(this).raise();
    });

    groups.on("mouseleave", function () {
      // eslint-disable-next-line no-invalid-this
      groups.order();
    });
  }

  getColor(file: File): string {
    if (!this.legend || !file.extra.labels) { return "blue"; }
    return this.legend[file.extra.labels].color;
  }

  getInitials(file: File): string {
    if (file.extra.fullName) {
      const splitName = file.extra.fullName.split(" ");
      if (splitName.length === 2) {
        return (splitName[0][0] + splitName[1][0]).toUpperCase();
      } else {
        return file.extra.fullName[0].toUpperCase();
      }
    } else {
      const path = file.path.split("/");
      return path[path.length - 1][0].toUpperCase();
    }
  }
}
</script>
<style>
.circle {
  border-radius: 50%;
  background-color: lightblue;
  text-align: center;
  width: 40px;
  height: 40px;
  line-height: 40px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin: 0 3px;
}

</style>
