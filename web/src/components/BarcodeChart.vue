<template>
  <div :id="identifier"/>
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

    // append the svg object to the body of the page
    const svg = d3.select(`#${this.identifier}`)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
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

    // Parse the Data
    // const data = await d3
    //   .csv("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/data_stackedXL.csv");
    const data = [temp];
    // List of subgroups = header of the csv files = soil condition here
    //
    // // List of groups = species here = value of the first column called group -> I show them on the X axis
    // // @ts-expect-error
    // const groups = d3.map(data, function (d) { return (d.group); }).keys();
    //
    // // Add X axis
    // const x = d3.scaleBand()
    //   .domain(groups)
    //   .range([0, width]);
    // svg.append("g")
    //   .attr("transform", "translate(0," + height + ")")
    //   .call(d3.axisBottom(x).tickSizeOuter(0));
    //
    // // Add Y axis
    //
    // // color palette = one color per subgroup
    const color = d3.scaleOrdinal()
      .domain(subgroups)
      .range(d3.schemeSet2);
    //
    // // stack the data? --> stack per subgroup
    const stackedData = d3.stack().keys(subgroups)(data);
    const max = stackedData[stackedData.length - 1][0][1];

    const y = d3.scaleLinear()
      .domain([0, max])
      .range([height, 0]);
    // svg.append("g")
    //   .call(d3.axisLeft(y));

    // ----------------
    // Highlight a specific subgroup when hovered
    // ----------------

    // Show the bars
    svg.append("g")
      .selectAll("g")
      // Enter in the stack data = loop key per key = group per group
      .data(stackedData)
      .enter().append("g")
      // @ts-expect-error
      .attr("fill", function (d) { return color(d.key); })
      .attr("class", function (d) { return "barcodeChartBar " + d.key; }) // Add a class to each subgroup: their name
      .selectAll("rect")
      // enter a second time = loop subgroup per subgroup to add all rectangles
      .data(function (d) { return d; })
      .enter().append("rect")
      // // @ts-expect-error
      // .attr("x", function (d) { return x(d.data.group); })
      .attr("y", function (d) { return y(d[1]); })
      .attr("height", function (d) { return y(d[0]) - y(d[1]); })
      .attr("width", width)
      .attr("stroke", "grey")
      .on("mouseover", this.mouseover)
      .on("mouseleave", this.mouseleave)
      .on("click", this.mouseclick);
    // Prep the tooltip bits, initial display is hidden
  }

  getClassNameFromEvent(rect: SVGRectElement[] | ArrayLike<SVGRectElement>): string {
    // @ts-expect-error
    return d3.select(rect[0].parentNode).datum().key;
  }

  mounted(): void {
    this.drawBar();
  }

  // What happens when user hover a bar
  mouseover(a: any, b: any, rect: SVGRectElement[] | ArrayLike<SVGRectElement>): void {
    this.$emit("selectionhoverenter", this.sideIdentifier, [this.getClassNameFromEvent(rect)]);
    // what subgroup are we hovering?
    // // @ts-expect-error
    // const subgroupName = d3.select((d3.event.target as HTMLElement).parentNode).datum().key;
    // // const subgroupValue = d.data[subgroupName];
    // // Reduce opacity of all rect to 0.2
    // d3.selectAll(".myRect").style("opacity", 0.2);
    // // Highlight all rects of this subgroup with opacity 0.8. It is possible to select them since they
    // // have a specific class = their name.
    // d3.selectAll("." + subgroupName)
    //   .style("opacity", 1);
  }

  // When user do not hover anymore
  mouseleave(a: any, b: any, rect: SVGRectElement[] | ArrayLike<SVGRectElement>): void {
    this.$emit("selectionhoverexit", this.sideIdentifier, [this.getClassNameFromEvent(rect)]);
    // Back to normal opacity: 0.8
    // d3.selectAll(".myRect")
    //   .style("opacity", 0.8);
  }

  mouseclick(a: any, b: any, rect: SVGRectElement[] | ArrayLike<SVGRectElement>): void {
    this.$emit("selectionclick", this.sideIdentifier, [this.getClassNameFromEvent(rect)]);
  }
}
</script>

<style scoped>

</style>
