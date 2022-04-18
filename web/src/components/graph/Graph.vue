<!-- eslint-disable -->
<template>
  <div ref="container" class="graph-container">
    <!-- Extra (optional) UI elements can be added to this container  -->
    <slot></slot>
  </div>
</template>

<script>
/* eslint-disable */

import {Component, Prop, Watch} from "vue-property-decorator";
import * as d3 from "d3";
import {ConvexHullTool} from "@/d3-tools/ConvexHullTool";
import {getClusterElements, getClusterIntersect} from "@/util/clustering-algorithms/ClusterFunctions";
import {DefaultMap} from "@dodona/dolos-lib";

@Component()
export default class PlagarismGraph {
  queryColorMap;
  @Prop() files;
  @Prop() pairs;
  @Prop() cutoff;
  @Prop() showSingletons;
  @Prop({default: {}}) legend;
  @Prop({default: true}) polygon;
  @Prop() clustering;
  @Prop() zoomTo;
  @Prop({ default: null }) selectedNode;


  created() {
    this.updateRoute();
    const svg = d3.create("svg").attr("viewBox", [0, 0, 500, 500]);
    svg.on("mousedown.s", () => {this.selectCluster(null, null); this.removeSelectedNode();})

    const container = svg.append("g");
    this.zoom = d3.zoom().on("zoom", (event) => {
      container.attr("transform", event.transform);
    });
    svg.call(this.zoom);

    if(this.zoomTo)
      this.drawChevron(svg);


    const defs = svg.append("svg:defs");
    defs
      .append("svg:marker")
      .attr("id", "arrow-marker")
      .attr("viewBox", "0 -6 10 12")
      .attr("refX", "5")
      .attr("markerWidth", 2)
      .attr("markerHeight", 2)
      .attr("orient", "auto")
      .append("svg:path")
      .attr("d", "M5,-5L10,0L5,5M10,0L0,0");

    this.svg = svg;
    this.svgLinks = container.append("g");
    this.svgNodes = container.append("g");

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
      .force("charge", d3.forceManyBody().distanceMax(200).strength(-20))
      .force("center", d3.forceCenter(this.width / 2, this.height / 2))
      .force("compact_x", d3.forceX(this.width / 2).strength(0.01))
      .force("compact_y", d3.forceY(this.height / 2).strength(0.01));

    this.simulation.on("tick", () => {
      if (this.svgLink)
        this.svgLink.attr("d", (d) => {
          const { x: x0, y: y0 } = d.source;
          const { x: x1, y: y1 } = d.target;
          return `M${x0},${y0}L${0.5 * (x0 + x1)},${
            0.5 * (y0 + y1)
          }L${x1},${y1}`;
        });

      if (this.svgNode)
        this.svgNode.attr("cx", (d) => d.x || 0).attr("cy", (d) => d.y || 0);

      if(this.hullTool && this.nodes.length && this.clustering) {
        this.hullTool.clear();

        for(const cluster of this.clustering) {
          // If any cluster is selected, make sure only the selected cluster is colored.
          // Else, color the cluster in the most appropriate color.
          const color = this.selectedCluster ?
            (this.selectedCluster === cluster ? (this.clusterColors.get(cluster)?.color || "blue") : "grey") :
            this.clusterColors.get(cluster)?.color || "blue";

          const elements = getClusterElements(cluster);
          this.hullTool.addConvexHullFromNodes(
            this.nodes.filter(n => elements.has(n.file)),
            color,
              cluster);
        }
      }

    });

    this.resizeHandler = () => {
      this.width = this.$refs.container.clientWidth || this.width;
      this.height = this.$refs.container.clientHeight || this.height;
    };
    window.addEventListener("resize", this.resizeHandler);
    this.recluster();
    this.updateGraph();
  }
  data() {
    return {
      nodes: [],
      links: [],
      width: 100,
      height: 100,
      selectedCluster: undefined,
    };
  }

  selectCluster(cluster, coordinates) {
    this.selectedCluster = cluster;
    this.updateGraph(false);

    if(cluster) {
      this.zoomToCenter(coordinates);
    }
  }

  zoomToCenter(coordinates) {
    const d3Coordinates = coordinates.map(v => [v.x, v.y]);

    if(d3Coordinates.length > 2) {
      const polygon = d3.polygonHull(d3Coordinates);
      polygon.push(polygon[0]);
      const [cx, cy] = d3.polygonCentroid(polygon);

      this.zoom.translateTo(this.svg, cx , cy )
    } else if (d3Coordinates.length === 2) {
      const [[x1, y1], [x2, y2]] = d3Coordinates;
      const [cx, cy] = [(x1 + x2) / 2, (y1 + y2) / 2];

      this.zoom.translateTo(this.svg, cx , cy )
    }
  }

  @Watch("$route")
  updateRoute() {
    this.queryColorMap = this.getQueryColorMap();
    if (this.resizeHandler) this.resizeHandler();
  }

  @Watch("$refs.container")
  updateSize() {
    this.resizeHandler();
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

    const scale =  this.height / 1080;

    this.svg.select(".chevron").attr("transform", `translate(${this.width / 2 - 150}, ${this.height - 200}) scale(${scale})`);
  }

  @Watch("cutoff")
  @Watch("files")
  @Watch("showSingletons")
  @Watch("legend")
  updateGraph() {
    setTimeout(() => this.resizeHandler(), 50);

    if (this.delayUpdateGraph >= 0) clearTimeout(this.delayUpdateGraph);
    this.delayUpdateGraph = setTimeout(() => {
      this.delayUpdateGraph = -1;
      const nodeMap = this.getRawNodeMap();
      const labels = this.legend;
      Object.values(nodeMap).forEach((node) => {
        node.component = -1;
        node.neighbors = [];
        node.links = [];
        node.visible = labels[node.label]? labels[node.label].selected:true;
      });
      this.links = Object.entries(this.pairs)
        .filter(([key, value]) => value.similarity >= this.cutoff)
        .filter(
          ([_, { leftFile, rightFile }]) =>
            nodeMap[leftFile.id].visible && nodeMap[rightFile.id].visible
        )
        .map(([key, value]) => {
          let left = nodeMap[value.leftFile.id];
          let right = nodeMap[value.rightFile.id];
          const leftInfo = left.file.extra;
          const rightInfo = right.file.extra;
          const directed = leftInfo.createdAt && rightInfo.createdAt;
          if (directed && rightInfo.createdAt < leftInfo.createdAt)
            [left, right] = [right, left];
          left.neighbors.push(right);
          right.neighbors.push(left);
          const similarity = value.similarity;
          const link = {
            id: key,
            directed: directed,
            source: left,
            target: right,
            similarity,
            linkWidth:
              4 * Math.pow(Math.max(0.4, (similarity - 0.75) / 0.2), 2),
          };
          left.links.push(link);
          right.links.push(link);
          return link;
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

      this.nodes = Object.values(nodeMap).filter((n) => n.visible);
      if (!this.showSingletons) {
        this.nodes = this.nodes.filter((n) => n.neighbors.length);
      }

      this.nodes.forEach((node, index) => {
        node.index = index;
        let incoming = 0;
        let outgoing = 0;
        node.links.forEach((l) => {
          if (l.directed) {
            if (l.target === node) ++incoming;
            else ++outgoing;
          }
        });
        node.source = outgoing > 1 && incoming === 0;


        const getDefaultNodeColor = (n) =>  !labels[n.label] ? d3.schemeCategory10[0]:labels[n.label].color
        let color;
        if(this.selectedCluster) {
          color = getClusterElements(this.selectedCluster).has(node.file) ? getDefaultNodeColor(node) : "grey";
        } else {
          color = getDefaultNodeColor(node)
        }
        node.fillColor = color;
      });

      this.recluster();

      if(this.hullTool)
        this.hullTool.clear();
    }, 50);
  }

  @Watch("clustering")
  recluster() {
    this.setupClusterColors(this.clustering);

    if(this.selectedCluster) {
      const intersects = this.clustering.filter(c => getClusterIntersect(c, this.selectedCluster).size > 0);
      if(intersects.length > 0)
        this.selectedCluster = intersects[0];
    }
  }

  removeSelectedNode() {
    if (this.selectedNode !== null) {
      this.emitSelectedNode(null);
    }
  }

  setupClusterColors(clustering) {
    this.clusterColors = new Map();
    for(const cluster of clustering) {
      const els = getClusterElements(cluster);
      const counter = new DefaultMap(() => 0);
      for (const el of els) {
        counter.set(el.extra.labels, counter.get(el.extra.labels) + 1)
      }

      let maxKey = undefined;
      for ( const [key, count] of counter.entries()) {
        if(count > counter.get(maxKey))
          maxKey = key;
      }

      this.clusterColors.set(cluster, this.legend[maxKey]);
    }
  }

  drawChevron(svg) {
    const chevron = svg
      .append("g")
      .attr("class", "chevron")
      .append("path")
      .attr("d", d3.line()([[0,0], [125,75 ], [250,0]]))
      .attr("stroke", "black")
      .attr("fill", "none")
      .style("stroke-width", 15)
      .style("stroke-opacity", 0.1)
      .style("cursor", "pointer")
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round");

    chevron.on("mouseenter", () => chevron.style("stroke-opacity", 0.2));
    chevron.on("mouseleave", () => chevron.style("stroke-opacity", 0.1));

    chevron.on("click", () => this.$vuetify.goTo(this.zoomTo));
  }

  @Watch("pairs")
  @Watch("files")
  clearCachedNodemap() {
    this._nodeMap = null;
  }

  getRawNodeMap() {
    if (this._nodeMap) return this._nodeMap;
    if (Object.entries(this.files).length === 0) return {};

    const nodeMap = {};
    let labels = new Set();
    Object.entries(this.files).forEach(([key, value]) => {
      const label = value.extra.labels || "N/A";
      labels.add(label);
      nodeMap[value.id] = {
        id: key,
        file: value,
        component: -1,
        neighbors: [],
        label: label,
        x: this.width * Math.random(),
        y: this.height * Math.random(),
        vx: 0,
        vy: 0,
      };
    });
    const colorScale = d3
      .scaleOrdinal(d3.schemeCategory10)
      .domain([...labels].reverse());
    labels = [...labels].sort().map((p) => ({
      label: p,
      selected: true,
      color: colorScale(p),
    }));
    // this.legend = Object.fromEntries(labels.map((p) => [p.label, p]));
    return (this._nodeMap = nodeMap);
  }

  getQueryColorMap() {
    const map = new Map();
    const { cutoff, ...colors } = this.$route.query;

    for (const [color, nodelist] of Object.entries(colors)) {
      const ids = nodelist.split(",").map((v) => +v);
      ids.forEach((v) => map.set(v, color));
    }

    return map;
  }

  @Watch("nodes")
  @Watch("links")
  updateSimulation() {
    this.svgLink = this.svgLinks
      .selectAll("path")
      .data(this.links)
      .join("path")
      .classed("link", true)
      .classed("directed", (d) => d.directed)
      .attr("stroke-width", (d) => d.linkWidth)
      ;

    this.svgNode = this.svgNodes
      .selectAll("circle")
      .data(this.nodes)
      .join("circle")
      .classed("node", true)
      .classed("source", (d) => d.source)
      .attr("r", 5)
      .attr("fill", (d) => d.fillColor)
      .attr("id", n => `circle-${n.file.id}`)
      .call(this.drag());

    if(this.hullTool)
      this.hullTool.clear();

    if(this.polygon)
      this.hullTool = new ConvexHullTool(this.svg.select("g"), this.selectCluster);

    this.simulation.nodes(this.nodes);
    this.simulation.alpha(0.5).alphaTarget(0.3).restart();
    this.simulation.force("link").links(this.links);
  }

  emitSelectedNode(node) {
      this.$emit("selectedNodeInfo", node);
  }

  @Watch("selectedCluster")
  emitCluster() {
    this.$emit("selectedClusterInfo", this.selectedCluster);
  }

  @Watch("selectedNode")
  onSelectedNode() {
    this.nodes.forEach(v => v.selected = false);
    this.svg.select(".selected").classed("selected", false);
    if(this.selectedNode) {

      this.nodes.find(n => n.file.id === this.selectedNode.id).selected = true;
      this.svgNodes.select(`#circle-${this.selectedNode.id}`).classed("selected", true);
    }
  }

  mounted() {
    this.$refs.container.prepend(this.svg.node());
    this.resizeHandler();
  }

  drag() {
    return d3
      .drag()
      .on("start", (event) => {
        if (!event.active) this.simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
        event.subject.justDragged = false;
      })
      .on("drag", (event) => {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
        event.subject.justDragged = true;
      })
      .on("end", (event) => {
        if (!event.active) this.simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
        if (!event.subject.justDragged) {
          // clicked
          if (event.subject.file && this.selectedNode && (event.subject.file.id === this.selectedNode.id)) {
            this.removeSelectedNode();
          } else {
            this.emitSelectedNode(event.subject.file);
          }
        }
      });
  }

  toCompareView(diff) {
    this.$router.push(`/compare/${diff.id}`);
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

    #arrow-marker {
      stroke: #666;
      fill: transparent;
      stroke-linecap: round;
    }

    .node {
      stroke: white;
      stroke-width: 2;
      stroke-linecap: round;

      &.source {
        stroke-width: 0;
      }
      &.selected {
        stroke: red;
        stroke-dasharray: 1.14, 2;
        stroke-width: 1;
      }
      &:hover {
        cursor: grab;
      }
    }

    .link {
      stroke: #999;
      opacity: 0.6;
      &.directed {
        marker-mid: url(#arrow-marker);
      }
      &:hover {
        cursor: pointer;
      }
    }
  }

  .settings {
    position: absolute;
    right: 0;
    bottom: 25px;
    z-index: 5;
  }
}
</style>
