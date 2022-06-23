<template>
  <div ref="container" class="graph-container">
    <!-- Extra (optional) UI elements can be added to this container  -->
    <slot />
  </div>
</template>

<script lang="ts">
/* eslint-disable */

import { defineComponent, PropType, ref, computed, watch, onMounted } from "@vue/composition-api";
import { useApiStore } from "@/api/stores";
import { Pair, File } from "@/api/models";
import { useCluster } from "@/composables";
import { storeToRefs } from "pinia";
import { useElementSize } from "@vueuse/core";
import { Clustering, Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import { getClusterElements, getClusterIntersect } from "@/util/clustering-algorithms/ClusterFunctions";
import { ConvexHullTool } from "@/d3-tools/ConvexHullTool";
import { DefaultMap } from "@dodona/dolos-lib";
import * as d3 from "d3";

export default defineComponent({
  props: {
    showSingletons: {
      type: Boolean as PropType<boolean>,
      default: false,
    },

    legend: {
      default: () => [],
    },

    polygon: {
      type: Boolean as PropType<boolean>,
      default: true,
    },

    clustering: {
      type: Array as PropType<Clustering>,
      default: () => [],
    },

    files: {
      type: Array as PropType<File[]>,
      default: () => [],
    },

    pairs: {
      type: Array as PropType<Pair[]>,
      default: () => [],
    },

    zoomTo: {
      type: String as PropType<string>,
      default: "",
    },

    selectedNode: {
      type: Object as PropType<File>,
      default: () => ({}),
    },
  },

  setup(props, { emit }) {
    const { cutoff } = storeToRefs(useApiStore());

    // Reference to the container element.
    const container = ref<HTMLElement>();
    // Container size
    const { width, height } = useElementSize(container);

    // Selected cluser
    const selectedCluster = ref<Cluster | null>(null);
    const selectedClusterMeta = useCluster(selectedCluster);

    // Map of nodes (files) in the graph.
    //  - key: file id
    //  - value: node object
    //
    // This map contains ALL nodes (also singletons/invisible nodes).
    const nodesMap = computed(() => {
      const nodesMap = new Map<number, any>();
      for (const file of props.files) {
        const label = file.extra.labels ?? "N/A";
        const labels = props.legend as any[];
        const visible = labels[label] ? labels[label].selected : true;

        nodesMap.set(file.id, {
          id: file.id,
          file,
          x: width.value * Math.random(),
          y: height.value * Math.random(),
          vx: 0,
          vy: 0,
          neighbors: [],
          edges: [],
          label,
          visible,
        });
      }

      return nodesMap;
    });

    // List of edges to display in the graph.
    const edges = ref();

    // List of node to display in the graph.
    const nodes = ref();

    // Cluster colors
    const clusterColors = computed(() => {
      const clusterColorsMap = new Map<Cluster, string>();
      const labels = props.legend as any[];

      for (const cluster of props.clustering) {
        const elements = getClusterElements(cluster);

        // Count for each label the number of files in the cluster.
        const counter = new DefaultMap(() => 0);
        for (const element of elements) {
          counter.set(element.extra.labels, counter.get(element.extra.labels) + 1)
        }

        // Find the label with the most files in the cluster.
        let maxKey = 0;
        for (const [key, count] of counter.entries()) {
          if (count > counter.get(maxKey)) maxKey = key;
        }

        clusterColorsMap.set(cluster, labels[maxKey].color);
      }

      return clusterColorsMap;
    });

    // SVG element of the simulation.
    const graph = d3.create("svg").attr("viewBox", [0, 0, 500, 500]);
    const graphContainer = graph.append("g");

    // If the graph has been rendered the first time.
    const graphInitialized = ref(false);

    // Edges between nodes in the graph.
    const graphEdgesBase = graphContainer.append("g");
    const graphEdges = ref();

    // Nodes in the graph.
    const graphNodesBase = graphContainer.append("g");
    const graphNodes = ref();

    // Convex hull tool for creating hulls around clusters.
    const graphHullTool = ref();

    // Add a marker to the graph for showing the direction of the edges.
    graph
      .append("svg:defs")
      .append("svg:marker")
      .attr("id", "arrow-marker")
      .attr("viewBox", "0 -6 10 12")
      .attr("refX", "5")
      .attr("markerWidth", 2)
      .attr("markerHeight", 2)
      .attr("orient", "auto")
      .append("svg:path")
      .attr("d", "M5,-5L10,0L5,5M10,0L0,0");

    // Select a cluster
    const selectCluster = (cluster: Cluster | null, coordinates: any): void => {
      selectedCluster.value = cluster;
      emit("selectedClusterInfo", cluster);
    };

    // Select a node
    const selectNode = (node: any | null): void => {
      emit("selectedNodeInfo", node);

      // Deselect all other nodes.
      nodes.value.forEach(n => n.selected = false);
      graph.select(".selected").classed("selected", false);

      // Select the new node (if not null).
      if (node) {
        node.selected = true;
        graph.select(`#circle-${node.id}`).classed("selected", true);
      }
    };
    
    // Handler for clicking on empty void in the graph.
    // Deselect the node & cluster.
    graph.on("mousedown.s", () => {
      selectNode(null);
      selectCluster(null, null);
    });

    // Calculate the edges of the graph.
    const calculateEdges = (): any[] => {
      return edges.value = props.pairs
        // Filter pairs with a similarity lower than the cutoff
        .filter(pair => pair.similarity >= cutoff.value)
        // Filter pairs where one of the files is not visible.
        .filter(pair => {
          const left = nodesMap.value.get(pair.leftFile.id);
          const right = nodesMap.value.get(pair.rightFile.id);
          return left.visible && right.visible;
        })
        // Map the pair to an edge object.
        .map(pair => {
          const left = nodesMap.value.get(pair.leftFile.id);
          const leftInfo = left.file.extra;
          const right = nodesMap.value.get(pair.rightFile.id);
          const rightInfo = right.file.extra;

          // If the edge is directed.
          // This is the case when both files contain a creation date.
          const directed = !!(leftInfo.createdAt && rightInfo.createdAt);

          // Determine the source & target nodes.
          let source = left;
          let target = right;
          // Switch the source & target when the right node is older than the left node.
          if (directed && rightInfo.createdAt < leftInfo.createdAt) {
            source = right;
            target = left;
          }

          // Add the the nodes to eachother's neighbors list.
          left.neighbors.push(right);
          right.neighbors.push(left);

          // Create the edge object.
          const edge = {
            id: pair.id,
            directed,
            source,
            target,
            similarity: pair.similarity,
            width: 4 * Math.pow(Math.max(0.4, (pair.similarity - 0.75) / 0.2), 2)
          };

          // Add the edge to the source & target nodes.
          source.edges.push(edge);
          target.edges.push(edge);

          return edge;
        });
    }

    // Calculate the nodes of the graph.
    const calculateNodes = (): any[] => {
      const labels = props.legend as any[];
      const nodesList = Array.from(nodesMap.value.values())
        // Only display the nodes that are visible.
        .filter(node => node.visible)
        // Only display the nodes that have neighbors.
        // Unless singletons are enabled.
        .filter(node => node.neighbors.length > 0 || props.showSingletons)
      
      for (const node of nodesList) {
        // Determine if the node is the source of a cluster.
        let incoming = 0;
        let outgoing = 0;
        
        for (const edge of node.edges) {
          if (edge.directed) {
            if (edge.source.id === node.id) incoming++;
            else outgoing++;
          }
        }

        // Node is the source of a cluster when
        // * there is at least one outgoing edge
        // * there are no incoming edges
        node.source = outgoing > 0 && incoming === 0;

        // Determine the color of the node.
        const defaultColor = labels[node.label] ? labels[node.label].color : d3.schemeCategory10[0];
        // When a cluster is selected
        // Make all other nodes gray, except for the nodes in the cluster.
        if (selectedCluster.value) {
          node.fillColor = selectedClusterMeta.clusterFilesSet.value.has(node.file) ? defaultColor : "grey";
        } else {
          node.fillColor = defaultColor;
        }
      }

      return nodesList;
    }

    // Update the graph
    const updateGraph = () => {
      // Clear side-effects, caused by previous calculations.
      for (const node of nodesMap.value.values()) {
        node.neighbors = [];
        node.edges = [];
      }

      // Update the edges.
      edges.value = calculateEdges();
      // Update the nodes.
      nodes.value = calculateNodes();
    }

    // Update the graph when the data changes.
    watch(
      () => [cutoff.value, props.showSingletons, ],
      () => updateGraph()
    );

    // D3 Simulation force link
    const forceLink = d3
      .forceLink()
      .id((d: any) => d.id)
      .strength(
        (link: any) =>
          Math.pow(Math.max(0.4, (link.similarity - 0.8) / 0.2), 3) /
          Math.min(link.source.neighbors.length, link.target.neighbors.length)
      );

    // D3 simulation
    const simulation = d3
      .forceSimulation()
      .alphaDecay(0.1)
      .force("link", forceLink)
      .force("charge", d3.forceManyBody().distanceMax(200).strength(-20))
      .force("center", d3.forceCenter(width.value / 2, height.value / 2))
      .force("compact_x", d3.forceX(width.value / 2).strength(0.01))
      .force("compact_y", d3.forceY(height.value / 2).strength(0.01));

    // D3 Simulation Drag ability
    const simulationDrag = d3
      .drag()
      .on("start", (event) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
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
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;

        // When the user clicks on the graph.
        if (!event.subject.justDragged) {
          // Toggle the selected file.
          if (event.subject.file && props.selectedNode && event.subject.file.id === props.selectedNode.id) {
            selectNode(null);
          }
          // Click on a file.
          else {
            selectNode(event.subject.file);
          }
        }
      });

    // Handler for every tick in the simulation.
    // A "tick" is a simulation step.
    simulation.on("tick", () => {
      if (graphEdges.value) {
        graphEdges.value.attr("d", (edge: any) => {
          const { x: x0, y: y0 } = edge.source;
          const { x: x1, y: y1 } = edge.target;
          return `M${x0},${y0}L${0.5 * (x0 + x1)},${0.5 * (y0 + y1)}L${x1},${y1}`;
        });
      }

      if (graphNodes.value) {
        graphNodes.value
          .attr("cx", (node: any) => node.x ?? 0)
          .attr("cy", (node: any) => node.y ?? 0);
      }

      if (graphHullTool.value) {
        graphHullTool.value.clear();

        for (const cluster of props.clustering) {
          // If any cluster is selected, make sure only the selected cluster is colored.
          // Else, color the cluster in the most appropriate color.
          let color = clusterColors.value.get(cluster);
          if (selectedCluster.value && selectedCluster.value === cluster) color = color ?? "blue";
          if (selectedCluster.value && selectedCluster.value !== cluster) color = "grey";

          // Add convex hull to the cluster.
          const elements = getClusterElements(cluster);
          graphHullTool.value.addConvexHullFromNodes(
            nodes.value.filter(node => elements.has(node.file)),
            color,
            cluster
          );
        }
      }
    });

    // Watch changes to the nodes and update the rendered graph nodes/edges.
    watch(
      () => [edges.value, nodes.value],
      ([edges, nodes]) => {
        // Create the edges
        graphEdges.value = graphEdgesBase
          .selectAll("path")
          .data(edges)
          .join("path")
          .classed("link", true)
          .classed("directed", (edge: any) => edge.directed)
          .attr("stroke-width", (edge: any) => edge.width)

        // Create the nodes
        graphNodes.value = graphNodesBase
          .selectAll("circle")
          .data(nodes)
          .join("circle")
          .classed("node", true)
          .classed("source", (node: any) => node.source)
          .attr("r", 5)
          .attr("fill", (node: any) => node.fillColor)
          .attr("id", (node: any) => `circle-${node.file.id}`)
          .call(simulationDrag);

        // Create the Convex Hull around every cluster.
        // A Convex Hull is a polygon that encloses all the nodes in the cluster.
        if (props.polygon) {
          // Clear the convex hull, if it exists.
          graphHullTool.value?.clear();

          // Create the convex hull.
          graphHullTool.value = new ConvexHullTool(graph.select("g"), selectedCluster.value);
        }

        // Set the nodes/edges of the simulation.
        simulation.nodes(nodes);
        simulation.force("link").links(edges);
        simulation.alpha(0.5).alphaTarget(0.3).restart();
      }
    );

    // Watch width/height changes & update the graph size.
    watch(
      () => [width.value, height.value],
      ([width, height]) => {
        // Resize the graph.
        graph.attr("viewBox", [0, 0, width, height]);

        // Resize the simulation.
        simulation.force("compact_x").x(width / 2);
        simulation.force("compact_y").y(height / 2);
        simulation.force("center").x(width / 2) .y(height / 2);

        // Update the graph when not yet initialized.
        // This must be done here, since the initial size of the graph is otherwise incorrect.
        if (!graphInitialized.value) {
          graphInitialized.value = true;
          updateGraph();
        }
      }
    );

    // Add the graph to the container.
    onMounted(() => container.value?.prepend(graph.node()));

    return {
      container,
    };
  },
});
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
        stroke-width: 2;
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
