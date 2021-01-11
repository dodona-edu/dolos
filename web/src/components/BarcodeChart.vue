<template >
  <div :id="identifier" class="barcodeChart">
    <component :is="'style'" type="text/css">
      <template v-for="item in activeSelections">
        .{{item}} {
          fill: var(--markedbg);
        }
      </template>
      <template v-for="item in hoveringSelections">
        .marked.{{ item }} {
        fill: var(--hoveringbg);
        }
      </template>
      <template v-for="item in selectedSelections">
        .marked.{{ item }} {
          fill: var(--selectedbg);
        }
      </template>
    </component>
    <svg preserveAspectRatio="none" class="svg-content-responsive">
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
  @Prop({ required: true }) selections!: Array<Selection>;
  @Prop({ required: true }) sideIdentifier!: string;
  @Prop({ required: true }) maxLines!: number;
  @Prop({ required: true }) lines!: number;
  @Prop({ required: true }) documentScrollFraction!: number;
  @Prop({ required: true }) amountOfLinesVisible!: number;
  @Prop() selectedSelections!: Array<string>;
  @Prop({ required: true }) hoveringSelections!: Array<string>;
  @Prop({ required: true }) activeSelections!: Array<string>;

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

  scrollHighlighterHeight(): number {
    return (this.lines / this.maxLines) * Math.floor(this.amountOfLinesVisible);
  }

  get scrollOffset(): number {
    return Math.min(
      this.documentScrollFraction * (this.lines - this.scrollHighlighterHeight()) * this.lines / this.maxLines,
      this.lines - this.scrollHighlighterHeight()
    );
  }

  get identifier(): string {
    return `${this.sideIdentifier}-chart`;
  }

  drawBar(): void {
    const svg = d3.select(`#${this.identifier} .svg-content-responsive`)
      .attr("viewBox", [0, 0, 1, this.lines].join(" "));

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

    const y: d3.ScaleLinear<number, number> =
      d3.scaleLinear()
        .domain([0, this.maxLines])
        .range([this.lines, 0]);
    const ys: (d: number) => number = (d: number) => y(d) || 0;

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
      .attr("y", d => { return this.lines - ys(d[0]); })
      .attr("height", function (d) { return ys(d[0]) - ys(d[1]); })
      .attr("width", this.lines)
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
@use 'variables';

.barcodeChartBar {
  fill: #f5f2f0;
}

.barcodeChart {
  display: inline-block;
  position: relative;
  width: 3vw;
  height: var(--code-height);
  padding-bottom: 100%;
  vertical-align: top;
  overflow: hidden;

  .svg-content-responsive {
    height: 100%;
    width: 100%;
    display: inline-block;
    position: absolute;
    top: 0;
    left: 0;

    #page-scroll-highlighter {
      width: 40px;
      fill: gray;
      fill-opacity: 0.2;
      pointer-events: none;
    }
  }
}

</style>
