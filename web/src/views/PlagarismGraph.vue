<!-- eslint-disable -->
<template>
  <div ref="root"></div>
</template>

<script>
/* eslint-disable */

import { Vue, Component } from "vue-property-decorator";
import DataView from "@/views/DataView";
import * as d3 from "d3";

@Component()
export default class PlagarismGraph extends DataView {
  mounted() {
    // @ts-ignore
    const svg = d3.create("svg").attr("viewBox", [0, 0, 500, 500]);

    const container = svg.append("g");
    d3.zoom().on("zoom", () => {
      container.attr("transform", d3.event.transform);
    })(svg);

    (async () => {
      if (!this.dataLoaded) await this.ensureData();

      const nodeMap = {};
      let nodes = Object.entries(this.files).map(([key, value]) => {
        return (nodeMap[value.id] = {
          id: key,
          file: value,
          component: -1,
          neighbors: [],
        });
      });
      const cutoff = 0.7;
      const links = Object.entries(this.diffs)
        .filter(([key, value]) => value.similarity > cutoff)
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
            linkWidth: 4 * Math.pow(similarity, 2),
          };
        });
      nodes = nodes.filter((n) => n.neighbors.length);

      let component = 0;
      nodes.forEach((node) => {
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

      const link = container
        .append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke-width", (d) => d.linkWidth);

      const node = container
        .append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("r", 5)
        .attr("fill", (d) => "red")
        .call(this.drag());

      if (this.simulation) this.simulation.stop();
      const simulation = d3
        .forceSimulation(nodes)
        .alphaDecay(0.001)
        .force(
          "link",
          d3
            .forceLink(links)
            .id((d) => d.id)
            .strength(
              (d) =>
                (0.1 +
                  0.9 * Math.pow((d.similarity - cutoff) / (1 - cutoff), 3)) /
                (d.source.neighbors + d.target.neighbors)
            )
        )
        .force("charge", d3.forceManyBody().strength(-20))
        .force("center", d3.forceCenter(500 / 2, 500 / 2))
        .force("compact_x", d3.forceX(250))
        .force("compact_y", d3.forceY(250));

      simulation.on("tick", () => {
        link
          .attr("x1", (d) => d.source.x)
          .attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x)
          .attr("y2", (d) => d.target.y);

        node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
      });

      this.simulation = simulation;
    })();

    this.$refs.root.appendChild(svg.node());
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
    if (this.simulation) {
      this.simulation.stop();
      this.simulation = undefined;
    }
  }
}
</script>
