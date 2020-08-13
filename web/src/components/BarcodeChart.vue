<template >
  <div :id="identifier" class="barcodeChart svg-container">
    <svg class="svg-content-responsive">
      <rect
        ref="scroll-highlighter"
        id="page-scroll-highlighter"
        :y="scrollOffset"
        width="40"
        fill="white"
        fill-opacity="0.3"
        pointer-events="none"
        :style="'height: ' + this.scrollHighlighterHeight()"
      >
      </rect>
    </svg>
  </div>
</template>

<script lang="ts">

import { Component, Vue, Prop } from "vue-property-decorator";
import { Selection } from "@/api/api";
import { constructID } from "@/util/OccurenceHighlight";
import * as d3 from "d3";

@Component
export default class BarcodeChart extends Vue {
  @Prop() selections!: Array<Selection>;
  @Prop() sideIdentifier!: string;
  @Prop() maxLines!: number;
  @Prop() lines!: number;
  @Prop() documentScrollFraction!: number;
  @Prop() amountOfLinesVisible!: number;

  chart: {
    width: number;
    height: number;
  } = {
    width: 40,
    height: 58,
  }

  scrollHighlighterHeight(): number {
    return (this.chart.height / this.maxLines) * this.amountOfLinesVisible;
  }

  get scrollOffset(): number {
    return Math.min(
      this.documentScrollFraction * (this.chart.height - this.scrollHighlighterHeight()),
      this.chart.height - this.scrollHighlighterHeight()
    );
  }

  get identifier(): string {
    return `${this.sideIdentifier}-chart`;
  }

  drawBar(): void {
    const svg = d3.select(`#${this.identifier} .svg-content-responsive`)
      .attr("viewBox", [0, 0, this.chart.width, this.chart.height].join(" "));

    const temp: {[key: number]: number} = {};
    const subgroups = [];
    const map: {[key: number]: Array<string>} = {};
    for (let i = 0; i < this.lines; i += 1) {
      subgroups.push(i.toString());
      temp[i] = 1;
      map[i] = [];
    }

    for (const selection of this.selections) {
      for (let i = selection.startRow; i <= selection.endRow; i += 1) {
        const id = constructID(selection);
        if (!map[i].includes(id)) {
          map[i].push(id);
        }
      }
    }

    const data = [temp];
    const stackedData = d3.stack().keys(subgroups)(data);

    const y = d3.scaleLinear()
      .domain([0, this.maxLines])
      .range([this.chart.height, 0]);

    svg
      .insert("g", ":first-child")
      .selectAll("g")
      .data(stackedData)
      .enter().append("g")
      .attr("class", function (d) { return `barcodeChartBar line-${+d.key} ${map[+d.key].join(" ")}`; })
      .selectAll("rect")
      // enter a second time = loop subgroup per subgroup to add all rectangles
      .data(function (d) { return d; })
      .enter().append("rect")
      .attr("y", d => { return this.chart.height - y(d[0]); })
      .attr("height", function (d) { return y(d[0]) - y(d[1]); })
      .attr("width", this.chart.width)
      .on("mouseover", (a, b, rect) => this.mouseover(map, a, b, rect))
      .on("mouseleave", (a, b, rect) => this.mouseleave(map, a, b, rect))
      .on("click", (a, b, rect) => this.mouseclick(map, a, b, rect));
  }

  getKey(rect: SVGRectElement[] | ArrayLike<SVGRectElement>): number {
    // @ts-expect-error
    return d3.select(rect[0].parentNode).datum().key;
  }

  mounted(): void {
    this.drawBar();
  }

  mouseover(map: {[key: number]: Array<string>}, a: any, b: any, rect: SVGRectElement[] | ArrayLike<SVGRectElement>):
    void {
    const key = this.getKey(rect);
    const classes = map[key];
    if (classes.length) {
      this.$emit("selectionhoverenter", this.sideIdentifier, classes, key);
    }
  }

  mouseleave(map: {[key: number]: Array<string>}, a: any, b: any, rect: SVGRectElement[] | ArrayLike<SVGRectElement>):
    void {
    const key = this.getKey(rect);
    const classes = map[key];
    if (classes.length) {
      this.$emit("selectionhoverexit", this.sideIdentifier, classes, key);
    }
  }

  mouseclick(map: {[key: number]: Array<string>}, a: any, b: any, rect: SVGRectElement[] | ArrayLike<SVGRectElement>):
    void {
    const key = this.getKey(rect);
    const classes = map[key];
    if (classes.length) {
      this.$emit("selectionclick", this.sideIdentifier, classes, key);
    }
  }
}
</script>

<style>
  .svg-container {
    display: inline-block;
    position: relative;
    /*width: 30px;*/
    width: 3vw;
    height: 70vh;
    padding-bottom: 100%; /* aspect ratio */
    vertical-align: top;
    overflow: hidden;
  }
  .svg-content-responsive {
    height: 100%;
    display: inline-block;
    position: absolute;
    top: 0;
    left: 0;
  }
</style>
