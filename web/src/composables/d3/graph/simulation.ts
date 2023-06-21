import { D3Edge, D3Node, Data } from "@/composables/d3/graph/data";
import { draw } from "@/composables/d3/graph/rendering";
import * as d3 from "d3";
import { shallowRef, ShallowRef, watch } from "vue";

export interface Simulation extends d3.Simulation<D3Node, D3Edge> {
  paused: ShallowRef<boolean>,
  links: (links: D3Edge[]) => void,
  translation(): [number, number],
  findNode(x: number, y: number, radius?: number): D3Node | undefined,
  reheat(): void;
  redraw(): void;
}

function updateGroups(data: Data): void {
  for (const group of data.groups) {
    if (group.nodes.length > 2) {
      group.hull = d3.polygonHull(group.nodes.map(node => [node.x, node.y]))!;
    } else if (group.nodes.length === 2) {
      // hull() doesn't work with two points, so we'll just draw a line.
      const [a, b] = group.nodes;
      group.hull = [[a.x, a.y], [b.x, b.y]];
    } else {
      group.hull = [];
    }
  }
}


export function createSimulation(context: CanvasRenderingContext2D, data: Data): Simulation {
  const distanceMin = 30;
  const distanceMax = 30;

  const forceLink = d3
    .forceLink<D3Node, D3Edge>(data.edges)
    .id(d => d.id)
    .distance(link => distanceMin + (distanceMax * (1 - link.similarity)));

  const simulation = d3
    .forceSimulation<D3Node, D3Edge>(data.nodes)
    .force("link", forceLink)
    .force("charge", d3.forceManyBody().strength(-100))
    .force("compact_x", d3.forceX())
    .force("compact_y", d3.forceY());

  simulation.on("tick", redraw);

  function redraw(): void {
    updateGroups(data);
    draw(context, data);
  }


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
    forceLink.links(links);
  }

  function reheat(): void {
    if (!paused.value) {
      simulation.alpha(.5).restart();
    }
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
    redraw,
    links
  });
}
