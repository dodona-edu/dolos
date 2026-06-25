import type {  Edge, Node, D3Node, Group } from "@/composables/d3/graph/data";
import { onMounted, onUnmounted, ShallowRef, Ref, shallowRef } from "vue";
import { useDebounceFn, useEventListener } from "@vueuse/core";
import * as d3 from "d3";
import { Data } from "@/composables/d3/graph/data";
import { createSimulation } from "@/composables/d3/graph/simulation";
import { seedClusterLayout } from "@/composables/d3/graph/layout";
import {
  createDrag,
  createSelect,
  createTooltips
} from "@/composables/d3/graph/interaction";

export { Node, Edge, Group };

export interface D3ForceGraphOptions {
  nodeSize: Ref<number>,
  container: ShallowRef<HTMLElement | undefined>;
  nodeTooltip: Ref<boolean>;
  onNodeClick?: (node: Node) => void;
  width: Ref<number>,
  height: Ref<number>,
}

export interface D3ForceGraph {
  update(nodes: Node[], edges: Edge[], clusters: Group[]): void;
  paused: ShallowRef<boolean>;
  selectedNode: ShallowRef<Node | undefined>;
  selectedGroup: ShallowRef<Group | undefined>;
}


export function useD3ForceGraph(options: D3ForceGraphOptions): D3ForceGraph {
  const data = new Data();
  const context: CanvasRenderingContext2D = document.createElement("canvas").getContext("2d")!;

  const simulation = createSimulation(context, data);


  const selectedNode = shallowRef();
  const selectedGroup = shallowRef();
  let seeded = false;

  // This function will update the (initially empty) selection of nodes and edges to represent
  // the given files and pairs.
  const update = (nodes: Node[], edges: Edge[], groups: Group[]): void => {
    data.update(nodes, edges, groups);
    // On the first render, seed deterministic cluster-grouped start positions
    // before the simulation assigns its own (origin phyllotaxis), so the layout
    // settles reproducibly. Later updates keep the existing layout and let any
    // newly added nodes slot into it.
    if (!seeded) {
      seedClusterLayout(data);
      seeded = true;
    }
    simulation.nodes(data.nodes);
    simulation.links(data.edges);
    simulation.reheat();
  };

  const resize = (): void => {
    if (!options.container.value) return;
    const w = options.container.value!.clientWidth;
    const h = options.container.value!.clientHeight;
    context.canvas.width = w;
    context.canvas.height = h;
    simulation.redraw();
  };

  // useEventListener removes the listener automatically when the component's
  // effect scope is disposed (unmount), so the graph view can mount/unmount
  // repeatedly without leaking listeners (and the captured simulation/canvas).
  useEventListener(window, "resize", useDebounceFn(resize, 200));

  // Add the graph to the container.
  onMounted(() => {
    const container = options.container.value;
    if (!container) throw new Error("Graph container was not ready yet.");

    const tooltip = createTooltips(simulation, options.container.value!);
    const drag = createDrag(simulation);
    const select = createSelect(data, simulation, selectedNode, selectedGroup, options.onNodeClick);

    const canvas = d3.select<HTMLCanvasElement, D3Node>(context.canvas);
    canvas.call(drag);
    canvas.call(select);
    if (options.nodeTooltip) {
      canvas.call(tooltip);
    }

    resize();
    container.prepend(canvas.node()!);
  });

  // Stop the simulation when the component is unmounted.
  onUnmounted(() => {
    simulation.stop();
  });

  return { update, paused: simulation.paused, selectedGroup, selectedNode };
}
