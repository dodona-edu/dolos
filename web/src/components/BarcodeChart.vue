<template >
  <svg :id="identifier"></svg>
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

  get identifier(): string {
    return `${this.sideIdentifier}-chart`;
  }

  async drawBar(): Promise<void> {
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

    const temp: {[key: string]: number} = {};

    this.selections.forEach(selection => {
      temp[constructID(selection)] = (selection.endRow - selection.startRow + 1);
    });

    const subgroups = [...new Set(this.selections.map(constructID))];
    subgroups.sort();
    subgroups.reverse();

    const data = [temp];
    // // color palette = one color per subgroup
    // const color = d3.scaleOrdinal()
    //   .domain(subgroups)
    //   .range(d3.schemeSet2);
    const stackedData = d3.stack().keys(subgroups)(data);
    const max = stackedData[stackedData.length - 1][0][1];

    const y = d3.scaleLinear()
      .domain([0, max])
      .range([height, 0]);

    // Show the bars
    svg.append("g")
      .selectAll("g")
      // Enter in the stack data = loop key per key = group per group
      .data(stackedData)
      .enter().append("g")
      // // @ts-expect-error
      // .attr("fill", function (d) { return color(d.key); })
      .attr("class", function (d) { return "barcodeChartBar " + d.key; }) // Add a class to each subgroup: their name
      .selectAll("rect")
      // enter a second time = loop subgroup per subgroup to add all rectangles
      .data(function (d) { return d; })
      .enter().append("rect")
      .attr("y", function (d) { return y(d[1]); })
      .attr("height", function (d) { return y(d[0]) - y(d[1]); })
      .attr("width", width)
      .attr("stroke", "grey")
      .on("mouseover", this.mouseover)
      .on("mouseleave", this.mouseleave)
      .on("click", this.mouseclick);
  }

  getClassNameFromEvent(rect: SVGRectElement[] | ArrayLike<SVGRectElement>): string {
    // @ts-expect-error
    return d3.select(rect[0].parentNode).datum().key;
  }

  mounted(): void {
    this.drawBar();
  }

  mouseover(a: any, b: any, rect: SVGRectElement[] | ArrayLike<SVGRectElement>): void {
    this.$emit("selectionhoverenter", this.sideIdentifier, [this.getClassNameFromEvent(rect)]);
  }

  mouseleave(a: any, b: any, rect: SVGRectElement[] | ArrayLike<SVGRectElement>): void {
    this.$emit("selectionhoverexit", this.sideIdentifier, [this.getClassNameFromEvent(rect)]);
  }

  mouseclick(a: any, b: any, rect: SVGRectElement[] | ArrayLike<SVGRectElement>): void {
    this.$emit("selectionclick", this.sideIdentifier, [this.getClassNameFromEvent(rect)]);
  }
}
</script>

<style scoped>

</style>
