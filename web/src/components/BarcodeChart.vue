<template >
  <svg :id="identifier" class="barcodeChart"></svg>
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

  get identifier(): string {
    return `${this.sideIdentifier}-chart`;
  }

  drawBar(): void {
    // set the dimensions and margins of the graph
    // const margin = { top: 10, right: 30, bottom: 20, left: 50 };
    const margin = { top: 0, right: 0, bottom: 0, left: 0 };
    const width = 40 - margin.left - margin.right;
    const height = 700 - margin.top - margin.bottom;

    const svg = d3.select(`#${this.identifier}`)
      // .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      // .attr("height", "70vh")
      .append("g")
      .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

    const temp: {[key: number]: number} = {};
    const subgroups = [];
    const map: {[key: number]: Array<string>} = {};
    for (let i = 0; i < this.lines; i += 1) {
      subgroups.unshift(i.toString());
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

    // const subgroups = [...new Set(this.selections.map(constructID))];
    // subgroups.sort();
    // subgroups.reverse();

    const data = [temp];
    const stackedData = d3.stack().keys(subgroups)(data);

    const y = d3.scaleLinear()
      .domain([0, this.maxLines])
      .range([height, 0]);

    // Show the bars
    svg.append("g")
      .selectAll("g")
      // Enter in the stack data = loop key per key = group per group
      .data(stackedData)
      .enter().append("g")
      // // @ts-expect-error
      // .attr("fill", function (d) { return color(d.key); })
      .attr("class", function (d) { return "barcodeChartBar " + map[+d.key].join(" "); })
      .selectAll("rect")
      // enter a second time = loop subgroup per subgroup to add all rectangles
      .data(function (d) { return d; })
      .enter().append("rect")
      .attr("y", function (d) { return y(d[1]); })
      .attr("height", function (d) { return y(d[0]) - y(d[1]); })
      .attr("width", width)
      // .attr("stroke", "grey")
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
    const classes = map[this.getKey(rect)];
    if (classes.length) {
      this.$emit("selectionhoverenter", this.sideIdentifier, classes);
    }
  }

  mouseleave(map: {[key: number]: Array<string>}, a: any, b: any, rect: SVGRectElement[] | ArrayLike<SVGRectElement>):
    void {
    const classes = map[this.getKey(rect)];
    if (classes.length) {
      this.$emit("selectionhoverexit", this.sideIdentifier, classes);
    }
  }

  mouseclick(map: {[key: number]: Array<string>}, a: any, b: any, rect: SVGRectElement[] | ArrayLike<SVGRectElement>):
    void {
    const classes = map[this.getKey(rect)];
    if (classes.length) {
      this.$emit("selectionclick", this.sideIdentifier, classes);
    }
  }
}
</script>

<style scoped>

</style>
