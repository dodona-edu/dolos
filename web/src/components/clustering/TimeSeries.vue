<template>
  <div :id="getSvgId()">
    <GraphLegend :current-files="legendData()" @legend="setLegend"/>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { File } from "@/api/api";
import * as d3 from "d3";
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import { getClusterElementsArray } from "@/util/clustering-algorithms/ClusterFunctions";
import { SelectionTool, xCoord } from "@/d3-tools/SelectionTool";
import GraphLegend from "@/d3-tools/GraphLegend.vue";
import { Legend } from "@/views/DataView";

interface TimeDataType extends xCoord { file: File, y?: number }

@Component({ components: { GraphLegend } })
export default class TimeSeriesDiagram extends Vue {
  @Prop() cluster!: Cluster;
  @Prop({ default: false }) selection!: boolean;
  @Prop({ default: [] }) selectedFiles!: File[];

  private readonly margin: { left: number; right: number; top: number; bottom: number };
  private readonly width: number;
  private readonly height: number;
  private legend: Legend | undefined;

  constructor() {
    super();
    this.margin = { top: 10, right: 30, bottom: 30, left: 40 };
    this.width = 900 - this.margin.left - this.margin.right;
    this.height = 400 - this.margin.top - this.margin.bottom;
  }

  mounted(): void {
    this.initialize();
  }

  private initialize(): void {
    const data = getClusterElementsArray(this.cluster).map(file => ({ file }));
    const xScale = this.getXScale(data);
    this.applySimulation(xScale, data);
    const svg = this.addSVG(xScale, data);
    this.addSelectionTool(svg, data);
  }

  private getXScale(files: TimeDataType[]): d3.ScaleTime<number, number> {
    return d3
      .scaleTime<number, number>()
      .domain(d3.extent(files.map(f => f.file.extra.timestamp!)) as [Date, Date])
      .range([0, this.width]);
  }

  private addSVG(
    xScale: d3.ScaleTime<number, number>,
    data: TimeDataType[]
  ): d3.Selection<SVGSVGElement, TimeDataType, HTMLElement, unknown> {
    d3.select(`#${this.getSvgId()}`).select("svg").remove();

    const svg = d3
      .select<d3.BaseType, TimeDataType>(`#${this.getSvgId()}`)
      .append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr(
        "height",
        this.height + this.margin.top + this.margin.bottom
      );

    const svgg = svg
      .append("g")
      .attr(
        "transform",
        "translate(" + this.margin.left + "," + this.margin.top + ")"
      );

    svgg
      .append("g")
      .attr("transform", `translate(0, ${this.height})`)
      .call(d3.axisBottom(xScale));

    svgg
      .selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("r", 6.5)
      .attr("cx", d => xScale(d.file.extra.timestamp!))
      .attr("cy", this.height / 2)
      .attr("fill", d => this.getColor((d.file)))
      .attr("visibility", d => this.getVisibility(d.file));

    return svg;
  }

  private applySimulation(
    xScale: d3.ScaleTime<number, number>,
    data: TimeDataType[]
  ): void {
    d3.forceSimulation<TimeDataType>(data)
      .force(
        "x",
        d3
          .forceX<TimeDataType>(d => {
            return xScale(d?.file?.extra?.timestamp || new Date());
          })
          .strength(1)
      )
      .force("y", d3.forceY(this.height / 2))
      .force("collision", d3.forceCollide().radius(5).strength(0.1))
      .alpha(1)
      .on("tick", () =>
        d3
          .selectAll<d3.BaseType, TimeDataType>("circle")
          .attr("cx", (d: TimeDataType) => d?.x || 0)
          .attr("cy", (d: TimeDataType) => d?.y || 0)
      );
  }

  private addSelectionTool(
    svg: d3.Selection<SVGSVGElement, TimeDataType, HTMLElement, unknown>,
    data: {file: File}[]
  ): void {
    if (this.selection) {
      // eslint-disable-next-line no-new
      new SelectionTool<TimeDataType>(
        svg,
        data,
        () => ({ height: this.height, width: this.width, margin: this.margin }),
        (d: TimeDataType[]) => this.$emit("filedata", d.map(f => f.file)),
      );
    }
  }

  @Watch("selectedFiles")
  private updateSelectedFiles(): void {
    d3.select(`#${this.getSvgId()}`).selectAll<any, TimeDataType>("circle").style("stroke",
      d => {
        return d.file && this.selectedFiles.map(f => f.id).includes(d.file.id) ? "red" : "";
      });
  }

  private _svgId: string | null = null;

  getSvgId(): string {
    if (!this._svgId) {
      this._svgId = `svg-file-histogram-${Math.round(Math.random() * 100000)}`;
    }
    return this._svgId;
  }

  legendData(): File[] {
    return getClusterElementsArray(this.cluster);
  }

  getColor(f: File): string {
    return f.extra?.labels && this.legend
      ? this.legend[f.extra.labels].color
      : "#1976D2";
  }

  getVisibility(f: File): string {
    return f.extra?.labels && this.legend
      ? this.legend[f.extra.labels].selected ? "visibile" : "hidden"
      : "visible";
  }

  private setLegend(l: Legend): void {
    this.legend = l;
    this.initialize();
  }
}
</script>
