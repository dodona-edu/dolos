<!-- eslint-disable -->
<template>
  <v-container fluid fill-height>
    <v-row style="height: 100%">
      <v-col cols="12" class="no-y-padding">
        <div ref="container" class="graph-container">
          <form class="settings">
            <label>
              Similarity ≥ {{ cutoff }}<br />
              <input
                type="range"
                min="0.5"
                max="1"
                step="0.01"
                v-model="cutoff"
              />
            </label>
          </form>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
/* eslint-disable */

import { Vue, Component, Watch } from "vue-property-decorator";
import DataView from "@/views/DataView";
import * as d3 from "d3";

@Component()
export default class PlagarismGraph extends DataView {
  created() {
    const svg = d3.create("svg").attr("viewBox", [0, 0, 500, 500]);
    const container = svg.append("g");
    d3.zoom().on("zoom", () => {
      container.attr("transform", d3.event.transform);
    })(svg);

    this.svg = svg;
    this.svgLinks = container
      .append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6);

    this.svgNodes = container
      .append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

    this.simulation = d3
      .forceSimulation()
      .alphaDecay(0.01)
      .force(
        "link",
        d3
          .forceLink()
          .id((d) => d.id)
          .strength(
            (link) =>
              Math.pow(Math.max(0.4, (link.similarity - 0.8) / 0.2), 3) /
              Math.min(
                link.source.neighbors.length,
                link.target.neighbors.length
              )
          )
      )
      .force("charge", d3.forceManyBody().distanceMax(200).strength(-10))
      .force("center", d3.forceCenter(this.width / 2, this.height / 2))
      .force("compact_x", d3.forceX(this.width / 2).strength(0.01))
      .force("compact_y", d3.forceY(this.height / 2).strength(0.01));

    this.simulation.on("tick", () => {
      if (this.svgLink)
        this.svgLink
          .attr("x1", (d) => d.source.x || 0)
          .attr("y1", (d) => d.source.y || 0)
          .attr("x2", (d) => d.target.x || 0)
          .attr("y2", (d) => d.target.y || 0);

      if (this.svgNode)
        this.svgNode.attr("cx", (d) => d.x || 0).attr("cy", (d) => d.y || 0);
    });

    this.resizeHandler = () => {
      this.width = this.$refs.container.clientWidth;
      this.height = this.$refs.container.clientHeight;
    };
    window.addEventListener("resize", this.resizeHandler);
  }
  data() {
    return {
      cutoff: 0.75,
      nodes: [],
      links: [],
      width: 100,
      height: 100,
    };
  }

  @Watch("width")
  @Watch("height")
  updateSize() {
    window.simulation = this.simulation;
    this.svg.attr("viewBox", [0, 0, this.width, this.height]);
    this.simulation.force("compact_x").x(this.width / 2);
    this.simulation.force("compact_y").y(this.height / 2);
    this.simulation
      .force("center")
      .x(this.width / 2)
      .y(this.height / 2);
  }

  @Watch("cutoff")
  @Watch("files")
  updateGraph() {
    if (this.delayUpdateGraph >= 0) clearTimeout(this.delayUpdateGraph);
    this.delayUpdateGraph = setTimeout(() => {
      this.delayUpdateGraph = -1;
      const nodeMap = this.getRawNodeMap();
      Object.values(nodeMap).forEach((node) => {
        node.component = -1;
        node.neighbors = [];
      });
      this.links = Object.entries(this.diffs)
        .filter(([key, value]) => value.similarity >= this.cutoff)
        .map(([key, value]) => {
          const left = nodeMap[value.leftFile.id];
          const right = nodeMap[value.rightFile.id];
          left.neighbors.push(right);
          right.neighbors.push(left);
          const similarity = value.similarity;
          return {
            id: key,
            source: left,
            target: right,
            similarity,
            linkWidth:
              4 * Math.pow(Math.max(0.4, (similarity - 0.75) / 0.2), 2),
          };
        });
      let component = 0;
      Object.values(nodeMap).forEach((node) => {
        if (node.component < 0) {
          node.component = ++component;
          const checkNode = [node];
          while (checkNode.length) {
            checkNode.pop().neighbors.forEach((n) => {
              if (n.component < 0) {
                n.component = component;
                checkNode.push(n);
              }
            });
          }
        }
      });
      this.nodes = Object.values(nodeMap).filter((n) => n.neighbors.length);
    }, 50);
  }
  getRawNodeMap() {
    if (!this.dataLoaded) return {};
    if (this._nodeMap) return this._nodeMap;
    const nodeMap = {};
    Object.entries(this.files).forEach(([key, value]) => {
      nodeMap[value.id] = {
        id: key,
        file: value,
        component: -1,
        neighbors: [],
        x: this.width * Math.random(),
        y: this.height * Math.random(),
        vx: 0,
        vy: 0,
      };
    });
    return (this._nodeMap = nodeMap);
  }
  @Watch("nodes")
  @Watch("links")
  updateSimulation() {
    this.svgLink = this.svgLinks
      .selectAll("line")
      .data(this.links)
      .join("line")
      .attr("stroke-width", (d) => d.linkWidth);

    this.svgNode = this.svgNodes
      .selectAll("circle")
      .data(this.nodes)
      .join("circle")
      .attr("r", 5)
      .attr("fill", (d) => "red")
      .call(this.drag());

    this.simulation.nodes(this.nodes);
    this.simulation.alpha(0.5).alphaTarget(0.3).restart();
    this.simulation.force("link").links(this.links);
  }

  mounted() {
    // @ts-ignore
    (async () => {
      if (!this.dataLoaded) await this.ensureData();
      this.updateSimulation();
    })();

    this.$refs.container.appendChild(this.svg.node());
    this.resizeHandler();
  }

  drag() {
    return d3
      .drag()
      .on("start", () => {
        const event = d3.event;
        if (!event.active) this.simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      })
      .on("drag", () => {
        const event = d3.event;
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      })
      .on("end", () => {
        const event = d3.event;
        if (!event.active) this.simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      });
  }

  destroyed() {
    this.simulation.stop();
    window.removeEventListener("resize", this.resizeHandler);
  }
}
</script>

<style lang="scss">
.graph-container {
  width: 100%;
  height: 100%;
  position: relative;

  svg {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }

  .settings {
    position: absolute;
    right: 0;
    bottom: 0;
    z-index: 5;
  }
}
</style>
