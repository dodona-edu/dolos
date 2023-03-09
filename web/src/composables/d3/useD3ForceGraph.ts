import { onMounted, onUnmounted, ShallowRef, shallowRef, watch, ComputedRef, Ref } from "vue";
import * as d3 from "d3";
import { Label } from "@/api/models";
import { useD3Tooltip } from "@/composables";


class Data {
  private nodesById: Map<number, D3Node> = new Map();
  private edgesById: Map<number, D3Edge> = new Map();

  public nodes: D3Node[] = [];
  public edges: D3Edge[] = [];
  public clusters: D3Cluster[] = [];

  public update(nodes: Node[], edges: Edge[], clusters: Cluster[]): void {
    const oldNodesById = this.nodesById;
    const oldEdgesById = this.edgesById;
    this.nodesById = new Map(nodes.map(node => [node.id, oldNodesById.get(node.id) || new D3Node(node)]));
    this.edgesById = new Map(edges.map(edge => [
      edge.id,
      oldEdgesById.get(edge.id) ||
          new D3Edge(edge, this.nodesById.get(edge.sourceId)!, this.nodesById.get(edge.targetId)!)
    ]));
    this.nodes = Array.from(this.nodesById.values());
    this.edges = Array.from(this.edgesById.values());

    this.clusters = [];
    for (const cluster of clusters) {
      const nodes = cluster.nodeIds.map(id => this.nodesById.get(id)).filter(node => node !== undefined) as D3Node[];
      const d3Cluster = new D3Cluster(cluster, nodes);
      if (d3Cluster.nodes.length > 0) {
        this.clusters.push(d3Cluster);
      }
    }
  }
}


interface Simulation extends d3.Simulation<D3Node, D3Edge> {
  paused: ShallowRef<boolean>,
  links: (links: D3Edge[]) => void,
  translation(): [number, number],
  findNode(x: number, y: number, radius?: number): D3Node | undefined,
  reheat(): void;

}


export interface D3ForceGraphOptions {
  nodeSize: number,
  container: ShallowRef<HTMLElement | undefined>;
  width: Ref<number>,
  height: Ref<number>,
}

export interface D3ForceGraph {
  update(nodes: Node[], edges: Edge[], clusters: Cluster[]): void;
  paused: ShallowRef<boolean>;
}

export interface Node {
  id: number;
  name: string;
  color: string;
  timestamp?: Date;
}

export interface Edge {
  id: number;
  sourceId: number;
  targetId: number;
  similarity: number;
}

export interface Cluster {
  nodeIds: number[];
}

class D3Node implements Node {
  id: number;
  name: string;
  x = NaN;
  y = NaN;
  vx = NaN;
  vy = NaN;
  neighbors: D3Node[] = [];
  edges: D3Edge[]= [];
  color: string;
  timestamp?: Date;

  constructor(node: Node) {
    this.id = node.id;
    this.name = node.name;
    this.color = node.color;
    this.timestamp = node.timestamp;
  }
}

class D3Edge implements Edge {
  id: number;
  sourceId: number;
  targetId: number;
  directed: boolean;
  source: D3Node;
  target: D3Node;
  similarity: number;
  width: number;

  constructor(edge: Edge, one: D3Node, other: D3Node) {
    this.id = edge.id;
    this.sourceId = edge.sourceId;
    this.targetId = edge.targetId;
    this.directed = !!(one.timestamp && other.timestamp);

    if (this.directed && one.timestamp! < other.timestamp!) {
      this.source = one;
      this.target = other;
    } else {
      this.source = other;
      this.target = one;
    }

    this.similarity = edge.similarity;
    this.width = 4 * Math.pow(Math.max(0.4, (edge.similarity - 0.75) / 0.2), 2);
  }
}

class D3Cluster implements Cluster {
  nodeIds: number[] = [];
  nodes: D3Node[] = [];
  hull: [number, number][] = [];
  color: string;

  constructor(cluster: Cluster, nodes: D3Node[]) {
    this.nodeIds = cluster.nodeIds;
    this.nodes = nodes;

    const colors = new Map<string, number>();
    let maxCount = 0;
    this.color = nodes[0].color;
    for (const node of nodes) {
      const count = (colors.get(node.color) || 0) + 1;
      colors.set(node.color, count);
      if (count > maxCount) {
        this.color = node.color;
        maxCount = count;
      }
    }
  }
}

function updateClusters(data: Data): void {
  for (const cluster of data.clusters) {
    if (cluster.nodes.length > 2) {
      cluster.hull = d3.polygonHull(cluster.nodes.map(node => [node.x, node.y]))!;
    } else {
      cluster.hull = [];
    }
  }
}

function draw(context: CanvasRenderingContext2D, data: Data): void {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  context.save();
  context.translate(context.canvas.width / 2, context.canvas.height / 2);

  context.globalAlpha = 0.2;
  for (const cluster of data.clusters) {
    if (cluster.hull.length > 0) {
      context.beginPath();
      context.moveTo(cluster.hull[0][0], cluster.hull[0][1]);
      for (const point of cluster.hull) {
        context.lineTo(point[0], point[1]);
      }
      context.closePath();
      context.fillStyle = cluster.color;
      context.fill();
      context.lineWidth = 25;
      context.lineJoin = "round";
      context.strokeStyle = cluster.color;
      context.stroke();
    }
  }
  context.globalAlpha = 1;

  for (const edge of data.edges) {
    context.beginPath();
    context.moveTo(edge.source.x, edge.source.y);
    context.lineTo(edge.target.x, edge.target.y);
    context.lineWidth = edge.width;
    context.strokeStyle = "#999";
    context.stroke();
  }

  for (const node of data.nodes) {
    context.beginPath();
    context.arc(node.x, node.y, 10, 0, 2 * Math.PI);
    context.fillStyle = node.color;
    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = "#fff";
    context.stroke();
  }

  context.restore();
}

function createSimulation(context: CanvasRenderingContext2D, data: Data): Simulation {
  const forceLink = d3
    .forceLink<D3Node, D3Edge>(data.edges)
    .id(d => d.id)
    .distance(20);

  const simulation = d3
    .forceSimulation<D3Node, D3Edge>(data.nodes)
    .force("link", forceLink)
    .force("charge", d3.forceManyBody().strength(-50))
    .force("collide", d3.forceCollide().radius(10))
    .force("center", d3.forceCenter())
    .force("compact_x", d3.forceX().strength(.25))
    .force("compact_y", d3.forceY().strength(.25));

  simulation.on("tick", () => {
    updateClusters(data);
    draw(context, data);
  });


  function translation(): [number, number] {
    return [context.canvas.width / 2, context.canvas.height / 2];
  }

  // While drawing, we've translated the canvas so that the center of the
  // canvas is the origin. We need to undo that translation when finding
  // the nodes under the mouse.
  function findNode(x: number, y: number, radius?: number): D3Node | undefined {
    const [tx, ty] = translation();
    return simulation.find(x - tx, y - ty, radius);
  }

  function links(links: D3Edge[]): void {
    forceLink.links(links.filter(e => e.similarity > .5));
  }

  function reheat(): void {
    simulation.alpha(.5).restart();
  }

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
    translation,
    findNode,
    reheat,
    links
  });
}

function createTooltips(
  simulation: Simulation,
  parent: HTMLElement
): (s: d3.Selection<HTMLCanvasElement, D3Node, null, undefined>) => void {
  const tooltip = useD3Tooltip({ relativeToTarget: true, parent });
  const showTooltip = (event: MouseEvent): void => {

    const node = simulation.findNode(event.offsetX, event.offsetY, 10);
    if (node) {
      const [tx, ty] = simulation.translation();
      tooltip.show(node.name);
      tooltip.moveTo(node.x + tx, node.y + ty);
    } else {
      tooltip.hide();
    }
  };
  return (selection: d3.Selection<HTMLCanvasElement, D3Node, null, undefined>) => {
    selection
      .on("mouseover", showTooltip)
      .on("mousemove", showTooltip)
      .on("mouseout", () => {
        tooltip.hide();
      });
  };
}

function createDrag(simulation: Simulation): d3.DragBehavior<HTMLCanvasElement, D3Node, unknown> {
  return d3.drag<HTMLCanvasElement, D3Node>()
    .subject((event) => simulation.findNode(event.sourceEvent.offsetX, event.sourceEvent.offsetY)!)
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
  const data = new Data();
  const context: CanvasRenderingContext2D = document.createElement("canvas").getContext("2d")!;
  const simulation = createSimulation(context, data);

  // This function will update the (initially empty) selection of nodes and edges to represent
  // the given files and pairs.
  const update = (nodes: Node[], edges: Edge[], clusters: Cluster[]): void => {
    data.update(nodes, edges, clusters);
    simulation.nodes(data.nodes);
    simulation.links(data.edges);
    simulation.reheat();
  };

  watch(options.container, () => {
    if (!options.container.value) return;
    const w = options.container.value.clientWidth;
    const h = options.container.value.clientHeight;
    context.canvas.width = w;
    context.canvas.height = h;
  });

  // Add the graph to the container.
  onMounted(() => {
    const container = options.container.value;
    if (!container) throw new Error("Graph container was not ready yet.");

    const tooltip = createTooltips(simulation, options.container.value!);
    const drag = createDrag(simulation);

    const canvas = d3.select<HTMLCanvasElement, D3Node>(context.canvas)
      .call(drag)
      .call(tooltip)
      .node()!;

    container.prepend(canvas);
  });

  // Stop the simulation when the component is unmounted.
  onUnmounted(() => {
    simulation.stop();
  });

  return { update, paused: simulation.paused };
}
