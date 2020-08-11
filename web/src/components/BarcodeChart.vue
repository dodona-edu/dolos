<template>
  <div :id="identifier"/>
</template>

<script lang="ts">

import { Component, Vue, Prop } from "vue-property-decorator";
import { Selection } from "@/api/api";
import * as d3 from "d3";

@Component
export default class BarcodeChart extends Vue {
  @Prop() selections!: Array<Selection>;
  @Prop() sideIdentifier!: string;

  get identifier(): string {
    return `${this.sideIdentifier}-chart`;
  }

  async mounted(): Promise<void> {
    // set the dimensions and margins of the graph
    const margin = { top: 10, right: 30, bottom: 20, left: 50 };
    const width = 460 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    // eslint-disable-next-line no-unused-vars
    const svg = d3.select(`#${this.identifier}`)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

    // Parse the Data
    const data = await d3
      .csv("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/data_stackedXL.csv");
    // List of subgroups = header of the csv files = soil condition here
    const subgroups = data.columns!.slice(1);
    //
    // // List of groups = species here = value of the first column called group -> I show them on the X axis
    // @ts-expect-error
    const groups = d3.map(data, function (d) { return (d.group); }).keys();
    //
    // // Add X axis
    const x = d3.scaleBand()
      .domain(groups)
      .range([0, width])
      .padding(0.2);
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x).tickSizeOuter(0));
    //
    // // Add Y axis
    const y = d3.scaleLinear()
      .domain([0, 120])
      .range([height, 0]);
    svg.append("g")
      .call(d3.axisLeft(y));
    //
    // // color palette = one color per subgroup
    const color = d3.scaleOrdinal()
      .domain(subgroups)
      .range(d3.schemeSet2);
    //
    // // stack the data? --> stack per subgroup
    // @ts-expect-error
    const stackedData = d3.stack().keys(subgroups)(data);

    // ----------------
    // Highlight a specific subgroup when hovered
    // ----------------

    // What happens when user hover a bar
    const mouseover = function (d: Element): void {
      // what subgroup are we hovering?
      // @ts-expect-error
      // eslint-disable-next-line no-invalid-this
      const subgroupName = d3.select(this.parentNode).datum().key; // This was the tricky part
      // const subgroupValue = d.data[subgroupName];
      // Reduce opacity of all rect to 0.2
      d3.selectAll(".myRect").style("opacity", 0.2);
      // Highlight all rects of this subgroup with opacity 0.8. It is possible to select them since they
      // have a specific class = their name.
      d3.selectAll("." + subgroupName)
        .style("opacity", 1);
    };

    // When user do not hover anymore
    const mouseleave = function (d: Element): void {
      // Back to normal opacity: 0.8
      d3.selectAll(".myRect")
        .style("opacity", 0.8);
    };

    // Show the bars
    svg.append("g")
      .selectAll("g")
      // Enter in the stack data = loop key per key = group per group
      .data(stackedData)
      .enter().append("g")
      // @ts-expect-error
      .attr("fill", function (d) { return color(d.key); })
      .attr("class", function (d) { return "myRect " + d.key; }) // Add a class to each subgroup: their name
      .selectAll("rect")
      // enter a second time = loop subgroup per subgroup to add all rectangles
      .data(function (d) { return d; })
      .enter().append("rect")
      // @ts-expect-error
      .attr("x", function (d) { return x(d.data.group); })
      .attr("y", function (d) { return y(d[1]); })
      .attr("height", function (d) { return y(d[0]) - y(d[1]); })
      .attr("width", x.bandwidth())
      .attr("stroke", "grey")
      // @ts-expect-error
      .on("mouseover", mouseover).on("mouseleave", mouseleave);
    // Prep the tooltip bits, initial display is hidden
  }
}
</script>

<style scoped>

</style>
