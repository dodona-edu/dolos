import { onMounted, onUnmounted, ShallowRef, shallowRef, watch, ComputedRef, Ref } from "vue";
import * as d3 from "d3";
import { Label, Pair, File } from "@/api/models";
import { useD3Tooltip } from "@/composables";

type SVG = d3.Selection<SVGSVGElement, undefined, null, undefined>;
type NodeSelection = d3.Selection<SVGCircleElement, Node, SVGGElement, undefined>;
type EdgeSelection = d3.Selection<SVGLineElement, Edge, SVGGElement, undefined>;

interface Context {
  edges: EdgeSelection,
  nodes: NodeSelection,
}


interface Simulation extends d3.Simulation<Node, Edge> {
  paused: ShallowRef<boolean>,
  links: (links: Edge[]) => void,
  reheat(): void;

}


export interface D3ForceGraphOptions {
  nodeSize: number,
  maxEdges: number,

  container: ShallowRef<HTMLElement | undefined>;
  threshold: Ref<number>,
  width: Ref<number>,
  height: Ref<number>,
}

export interface D3ForceGraph {
  update(files: File[], pairs: Pair[]): void;
  paused: ShallowRef<boolean>;
}

interface Node {
  id: number,
  file: File,
  x: number,
  y: number,
  vx: number,
  vy: number,
  neighbors: Node[],
  edges: Edge[],
  label?: Label
}

interface Edge {
  id: number,
  directed: boolean,
  source: Node,
  target: Node,
  similarity: number,
  width: number
}

function createGraphSVG(): { svg: SVG, context: Context } {
  const svg = d3.create("svg");

  // Create the selection for Nodes and Edges, currently empty
  const context: Context = {
    edges: svg.append("g").selectAll<SVGLineElement, Edge>("line").data([] as Edge[]),
    nodes: svg.append("g").selectAll<SVGCircleElement, Node>("circle").data([] as Node[]),
  };

  // Add a marker to the graph for showing the direction of the edges.
  svg.append("svg:defs")
    .append("svg:marker")
    .attr("id", "arrow-marker")
    .attr("viewBox", "0 -6 10 12")
    .attr("refX", "5")
    .attr("markerWidth", 2)
    .attr("markerHeight", 2)
    .attr("orient", "auto")
    .append("svg:path")
    .attr("d", "M5,-5L10,0L5,5M10,0L0,0");

  return {
    svg,
    context
  };
}


function createSimulation(context: Context, width: number, height: number): Simulation {
  const forceLink = d3
    .forceLink<Node, Edge>(context.edges.data())
    .id(d => d.id)
    .distance(20);

  const simulation = d3
    .forceSimulation<Node, Edge>(context.nodes.data())
    .force("link", forceLink)
    .force("charge", d3.forceManyBody().strength(-50))
    .force("collide", d3.forceCollide())
    .force("center", d3.forceCenter())
    .force("compact_x", d3.forceX().strength(.25))
    .force("compact_y", d3.forceY().strength(.25));

  simulation.on("tick", () => {
    context.edges
      .attr("x1", (edge: Edge) => edge.source.x)
      .attr("y1", (edge: Edge) => edge.source.y)
      .attr("x2", (edge: Edge) => edge.target.x)
      .attr("y2", (edge: Edge) => edge.target.y);
    context.nodes
      .attr("cx", (node: Node) => node.x)
      .attr("cy", (node: Node) => node.y);
  });

  const links = (links: Edge[]): void => { forceLink.links(links); };

  const reheat = (): void => { simulation.alpha(.5).restart(); };

  const paused = shallowRef(false);
  watch(paused, () => {
    if (paused.value) {
      simulation.stop();
    } else {
      reheat();
    }
  });

  return Object.assign(simulation, {
    paused,
    reheat,
    links
  });
}

function createDrag(simulation: Simulation): d3.DragBehavior<SVGCircleElement, Node, unknown> {
  return d3.drag<SVGCircleElement, Node>()
    .on("start", (event) => {
      if (!event.active && !simulation.paused.value) simulation.reheat();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    })
    .on("drag", (event) => {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    })
    .on("end", (event) => {
      event.subject.fx = null;
      event.subject.fy = null;
    });
}



export function useD3ForceGraph(options: D3ForceGraphOptions): D3ForceGraph {

  const threshold = options.threshold;
  const { svg, context } = createGraphSVG();
  const simulation = createSimulation(context, options.width.value, options.height.value);
  const drag = createDrag(simulation);
  const tooltip = useD3Tooltip({ relativeToMouse: true });

  // This function will update the (initially empty) selection of nodes and edges to represent
  // the given files and pairs.
  const update = (files: File[], pairs: Pair[]): void => {
    // Make a shallow copy to protect against mutation, while
    // recycling old nodes to preserve position and velocity
    const oldNodes = new Map(context.nodes.data().map(n => [n.id, n]));
    const oldEdges = new Map(context.edges.data().map(e => [e.id, e]));
    const newNodes: Node[] = files.map(file => oldNodes.get(file.id)
      || { id: file.id, file, neighbors: [], edges: [], x: NaN, y: NaN, vx: 0, vy: 0 });
    const nodeMap = new Map(newNodes.map(n => [n.id, n]));
    const newEdges: Edge[] = pairs.slice(0, options.maxEdges).map(pair => oldEdges.get(pair.id)
      || { id: pair.id, directed: false, source: nodeMap.get(pair.leftFile.id)!,
        target: nodeMap.get(pair.rightFile.id)!,
        similarity: pair.similarity,
        width: 4 * Math.pow(Math.max(0.4, (pair.similarity - 0.75) / 0.2), 2) });

    // Update the nodes and edges
    context.edges = context.edges.data(newEdges, d => d.id)
      .join(enter => enter.append("line"))
      .classed("edge", true)
      .attr("stroke", "#000")
      .attr("stroke-width", edge => edge.width);

    context.nodes = context.nodes.data(newNodes, d => d.id)
      .join(enter => enter.append("circle"))
      .call(drag)
      .on("click" , (event, node) => { console.log(node.file); })
      .classed("node", true)
      .attr("r", options.nodeSize)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .attr("id", d => `circle-${d.id}`);

    // Update the simulation
    simulation.nodes(newNodes);
    simulation.links(newEdges);
  };


  watch(options.container, () => {
    if (!options.container.value) return;
    const w = options.container.value.clientWidth;
    const h = options.container.value.clientHeight;
    svg.attr("viewBox", [-w / 2, -h / 2, w, h]);
  });

  // Add the graph to the container.
  onMounted(() => options.container.value?.prepend(svg.node()!));

  // Stop the simulation when the component is unmounted.
  onUnmounted(() => {
    simulation.stop();
  });

  return { update, paused: simulation.paused };
}
