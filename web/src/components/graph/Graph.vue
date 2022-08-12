<template>
  <div ref="container" class="graph-container">
    <!-- Extra (optional) UI elements can be added to this container  -->
    <slot />

    <!-- Optiosn -->
    <div class="graph-options">
      <v-btn
        :color="simulationPaused ? 'success' : 'warning'"
        text
        rounded
        @click="onPauseClick"
      >
        <template v-if="simulationPaused">
          <v-icon left>mdi-play-outline</v-icon>
          Resume
        </template>

        <template v-else>
          <v-icon left>mdi-pause</v-icon>
          Pause
        </template>
      </v-btn>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  shallowRef,
  computed,
  watch,
  onMounted,
  onUnmounted,
} from "vue";
import { useApiStore } from "@/api/stores";
import { Pair, File, Legend } from "@/api/models";
import { useCluster, useD3HullTool } from "@/composables";
import { storeToRefs } from "pinia";
import { useElementSize } from "@vueuse/core";
import { Clustering, Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import { getClusterElements } from "@/util/clustering-algorithms/ClusterFunctions";
import { DefaultMap } from "@dodona/dolos-lib";
import * as d3 from "d3";

interface Props {
  showSingletons?: boolean;
  legend: Legend;
  polygon?: boolean;
  clustering: Clustering;
  files: File[];
  pairs: Pair[];
  zoomTo?: string;
  selectedNode: File;
  width?: number;
  height?: number;
}

const props = withDefaults(defineProps<Props>(), {});
const emit = defineEmits(["selectedClusterInfo", "selectedNodeInfo"]);

const { cutoff, cutoffDebounced } = storeToRefs(useApiStore());

// Reference to the container element.
const container = shallowRef<HTMLElement>();
// Container size
const containerSize = useElementSize(container);
// Width & height
const width = computed(() => props.width ?? containerSize.width.value);
const height = computed(() => props.height ?? containerSize.height.value);

// Selected cluser
const selectedCluster = shallowRef<Cluster | null>(null);
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
    });
  }

  return nodesMap;
});

// Get if a node is visible or not.
const isVisible = (node: any): boolean => {
  const labels = props.legend ?? {};
  return labels[node.label] ? labels[node.label].selected : true;
};

// List of edges to display in the graph.
const edges = shallowRef();

// List of node to display in the graph.
const nodes = shallowRef();

// Cluster colors
const clusterColors = computed(() => {
  const clusterColorsMap = new Map<Cluster, string>();
  const labels = props.legend;

  for (const cluster of props.clustering) {
    const elements = getClusterElements(cluster);

    // Count for each label the number of files in the cluster.
    const counter = new DefaultMap(() => 0);
    for (const element of elements) {
      counter.set(element.extra.labels, counter.get(element.extra.labels) + 1);
    }

    // Find the label with the most files in the cluster.
    let maxKey = 0;
    for (const [key, count] of counter.entries()) {
      if (count > counter.get(maxKey)) maxKey = key as any;
    }

    clusterColorsMap.set(cluster, labels[maxKey].color);
  }

  return clusterColorsMap;
});

// Select a cluster
const selectCluster = (cluster: Cluster | null): void => {
  selectedCluster.value = cluster;
  emit("selectedClusterInfo", cluster);

  // The graph must be updated to update the fills of the nodes.
  // This is not the most efficient implementation and can definitely be improved.
  // For the simplicity of the refactor to the Composition API, this is taken from the previous version for now.
  updateGraph();
};

// SVG element of the simulation.
const graph = d3.create("svg").attr("height", 500).attr("width", 500);
const graphContainer = graph.append("g");

// If the graph has been rendered the first time.
const graphRendered = shallowRef(false);
// If the graph has been calculated the first time.
const graphCalculated = shallowRef(false);

// Edges between nodes in the graph.
const graphEdgesBase = graphContainer.append("g");
const graphEdges = shallowRef();

// Nodes in the graph.
const graphNodesBase = graphContainer.append("g");
const graphNodes = shallowRef();

// Convex hull tool for creating hulls around clusters.
const graphHullTool = useD3HullTool({
  canvas: graph.select("g"),
  onClick: selectCluster
});

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

// Select a node
const selectNode = (node: any | null): void => {
  emit("selectedNodeInfo", node);

  // Deselect all other nodes.
  for (const node of nodes.value) node.selected = false;
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
  selectCluster(null);
});

// Calculate the edges of the graph.
const calculateEdges = (): any[] => {
  return props.pairs
    // Filter pairs with a similarity lower than the cutoff
    .filter(pair => pair.similarity >= cutoff.value)
    // Filter pairs where one of the files is not visible.
    .filter(pair => {
      const left = nodesMap.value.get(pair.leftFile.id);
      const right = nodesMap.value.get(pair.rightFile.id);
      return isVisible(left) && isVisible(right);
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
};

// Calculate the nodes of the graph.
const calculateNodes = (): any[] => {
  const labels = props.legend;
  const nodesList = Array.from(nodesMap.value.values())
    // Only display the nodes that are visible.
    .filter(node => isVisible(node))
    // Only display the nodes that have neighbors.
    // Unless singletons are enabled.
    .filter(node => node.neighbors.length > 0 || props.showSingletons);

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
};

// Update the graph
const updateGraph = (): void => {
  // Clear side-effects, caused by previous calculations.
  for (const node of nodesMap.value.values()) {
    node.neighbors = [];
    node.edges = [];
  }

  // Update the edges.
  edges.value = calculateEdges();
  // Update the nodes.
  nodes.value = calculateNodes();
};

// Update the graph when the data changes.
watch(
  () => [cutoffDebounced.value, props.showSingletons, props.legend],
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

// If the simulation should be paused.
const simulationPaused = shallowRef(false);

// D3 simulation
const simulation = d3
  .forceSimulation()
  .alphaDecay(0.1)
  .force("link", forceLink)
  .force("charge", d3.forceManyBody().distanceMax(200).strength(-20))
  .force("center", d3.forceCenter(width.value / 2, height.value / 2))
  .force("compact_x", d3.forceX(width.value / 2).strength(0.01))
  .force("compact_y", d3.forceY(height.value / 2).strength(0.01))
  .stop();

// D3 Simulation Drag ability
const simulationDrag = d3
  .drag()
  .on("start", (event) => {
    if (!event.active && !simulationPaused.value) simulation.alphaTarget(0.3).restart();
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
        return;
      }

      // Click on a file.
      selectNode(event.subject.file);
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

  // Clear the hulls
  graphHullTool.clear();

  // Add new hulls
  for (const cluster of props.clustering) {
    // If any cluster is selected, make sure only the selected cluster is colored.
    // Else, color the cluster in the most appropriate color.
    let color = clusterColors.value.get(cluster);
    if (selectedCluster.value && selectedCluster.value === cluster) color = color ?? "blue";
    if (selectedCluster.value && selectedCluster.value !== cluster) color = "grey";

    // Add convex hull to the cluster.
    const elements = getClusterElements(cluster);
    graphHullTool.add(
      nodes.value.filter((node: any) => elements.has(node.file)),
      cluster,
      color,
    );
  }
});

// When the user clicks on the pause button.
const onPauseClick = (): void => {
  simulationPaused.value = !simulationPaused.value;

  if (simulationPaused.value) {
    simulation.stop();
  } else {
    simulation.restart();
  }
};

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
      .style("pointer-events", "none")
      .classed("directed", (edge: any) => edge.directed)
      .attr("stroke-width", (edge: any) => edge.width);

    // Create the nodes
    graphNodes.value = graphNodesBase
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .classed("node", true)
      .classed("source", (node: any) => node.source)
      .attr("r", 7)
      .attr("fill", (node: any) => node.fillColor)
      .attr("id", (node: any) => `circle-${node.file.id}`)
      .call(simulationDrag as any);

    // Set the nodes/edges of the simulation & restart.
    simulation.nodes(nodes);
    simulation.force<any>("link").links(edges);
    simulation.alpha(0.5).alphaTarget(0.3).restart();
    // Undo the pause.
    simulationPaused.value = false;

    // Do not show the initial moving to the center animation.
    // This will make the graph instantly render at the center.
    if (!graphCalculated.value) {
      simulation.stop();
      simulation.tick(edges.length); // more edges takes more ticks to reach the desired alpha
      simulation.restart();
      graphCalculated.value = true;
    }
  }
);

// Watch width/height changes & update the graph size.
watch(
  () => [width.value, height.value],
  ([width, height]) => {
    // Resize the graph.
    graph
      .attr("height", height)
      .attr("width", width);

    // Resize the simulation.
    simulation.force<any>("compact_x")?.x(width / 2);
    simulation.force<any>("compact_y")?.y(height / 2);
    simulation.force<any>("center")?.x(width / 2)?.y(height / 2);

    // Update the graph when not yet initialized.
    // This must be done here, since the initial size of the graph is otherwise incorrect.
    if (!graphRendered.value) {
      graphRendered.value = true;
      updateGraph();
    }
  }
);

// Add the graph to the container.
onMounted(() => container.value?.prepend(graph.node() as any));

// Stop the simulation when the component is unmounted.
onUnmounted(() => {
  simulation.stop();
});
</script>

<style lang="scss">
.graph-container {
  width: 100%;
  height: 100%;
  position: relative;

  svg {
    width: 100%;
    height: 100%;
    z-index: 1;

    #arrow-marker {
      stroke: #666;
      fill: transparent;
      stroke-linecap: round;
    }

    .node {
      stroke-linecap: round;

      &.source {
        // TODO:
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
}

.graph {
  &-options {
    position: absolute;
    z-index: 2;
    bottom: 1rem;
    left: 0;
  }
}
</style>
