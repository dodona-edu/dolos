<template >
  <div :id="identifier" class="barcodeChart">
    <svg class="svg-content-responsive">
      <rect
        ref="scrollHighlighter"
        id="page-scroll-highlighter"
        :y="scrollOffset"
      >
      </rect>
    </svg>
  </div>
</template>

<script lang="ts">

import { Component, Prop, Vue, Watch } from "vue-property-decorator";
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
  @Prop() selectedSelections!: Array<string>;
  @Prop() hoveringSelections!: Array<string>;

  chart: {
    width: number;
    height: number;
  } = {
    width: 40,
    height: 1000,
  }

  mounted(): void {
    this.drawBar();
  }

  makeSelector(blockClasses: Array<string>): string {
    return blockClasses
      .map(blockClass => `#${this.identifier} .${blockClass}`)
      .join(", ");
  }

  @Watch("amountOfLinesVisible")
  onAmountOfLinesVisibleChange(newValue: number): void {
    d3.select(this.$refs.scrollHighlighter as HTMLElement)
      .attr("height", this.scrollHighlighterHeight());
  }

  @Watch("hoveringSelections", { deep: true })
  onHoverSelectionsChange(newValue: Array<string>): void {
    d3.selectAll(`#${this.identifier} .barcodeChartBar.hovering`)
      .classed("hovering", false);

    if (newValue.length > 0) {
      d3.selectAll(this.makeSelector(newValue))
        .classed("hovering", true);
    }
  }

  @Watch("selectedSelections")
  onSelectionChange(newValue: Array<string>): void {
    d3.selectAll(`#${this.identifier} .barcodeChartBar.selected`)
      .classed("selected", false);

    if (newValue.length > 0) {
      d3.selectAll(this.makeSelector(newValue))
        .classed("selected", true);
    }
  }

  scrollHighlighterHeight(): number {
    return (this.chart.height / this.maxLines) * Math.floor(this.amountOfLinesVisible);
  }

  get scrollOffset(): number {
    return Math.min(
      this.documentScrollFraction * (this.chart.height - this.scrollHighlighterHeight()) * this.lines / this.maxLines,
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
    for (let i = 0; i <= this.lines; i += 1) {
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
      .attr("class", function (d) {
        const blocks = map[+d.key];
        let classes = `barcodeChartBar ${blocks.join(" ")}`;
        if (blocks.length > 0) {
          classes += " " + "marked";
        }
        return classes;
      })
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

<style lang="scss">
@use 'codeHighlightsColours';

.barcodeChart {
  display: inline-block;
  position: relative;
  width: 3vw;
  height: 70vh;
  padding-bottom: 100%;
  vertical-align: top;
  overflow: hidden;

  .svg-content-responsive {
    height: 100%;
    display: inline-block;
    position: absolute;
    top: 0;
    left: 0;

    .barcodeChartBar {
      fill: #f5f2f0;
    }

    .barcodeChartBar.marked {
      fill: var(--markedbg);
    }

    .barcodeChartBar.marked.hovering {
      fill: var(--hoveringb);
    }

    .barcodeChartBar.marked.selected {
      fill: var(--selectedbg);
    }

    #page-scroll-highlighter {
      width: 40px;
      fill: gray;
      fill-opacity: 0.2;
      pointer-events: none;
    }
  }
}

</style>
