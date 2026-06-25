import * as d3 from "d3";
import { D3Node, Data } from "@/composables/d3/graph/data";

// Golden angle: fills a disk evenly and deterministically (no RNG).
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

// Roughly the inter-node distance the link force settles on (see simulation.ts).
const NODE_SPACING = 30;

interface ClusterCircle {
  r: number;
  nodes: D3Node[];
  // Filled in by d3.packSiblings.
  x: number;
  y: number;
}

/**
 * Assign deterministic initial positions to every node, grouped by cluster.
 *
 * Without this, d3 drops all nodes into one tight phyllotaxis spiral at the
 * origin. From that chaotic, overlapping start the global arrangement is
 * decided during the first high-alpha ticks, and the simulation settles into
 * one of several basins depending on exactly how many ticks run — so the graph
 * (and its screenshot) is not reproducible.
 *
 * Instead we treat each cluster as a circle, pack the circles largest-first
 * (so big clusters land centrally and small ones spiral outward — the
 * arrangement the forces favour anyway), and drop each cluster's nodes into a
 * small disk around its packed centre. The simulation then only has to relax
 * locally and converges to a single steady state.
 */
export function seedClusterLayout(data: Data): void {
  // Each cluster is one unit; every ungrouped node is its own unit.
  const grouped = new Set<D3Node>();
  const units: D3Node[][] = [];
  for (const group of data.groups) {
    units.push(group.nodes);
    for (const node of group.nodes) grouped.add(node);
  }
  for (const node of data.nodes) {
    if (!grouped.has(node)) units.push([node]);
  }

  // Pack the units as circles, largest first → big clusters in the middle.
  const circles: ClusterCircle[] = units.map(nodes => ({
    r: clusterRadius(nodes.length),
    nodes,
    x: 0,
    y: 0,
  }));
  circles.sort((a, b) => b.r - a.r);
  d3.packSiblings(circles);

  for (const circle of circles) {
    fillDisk(circle.nodes, circle.x, circle.y, circle.r);
  }
}

// Radius that comfortably holds `count` nodes spaced NODE_SPACING apart, plus
// some padding so neighbouring clusters don't start out overlapping.
function clusterRadius(count: number): number {
  return NODE_SPACING * (Math.sqrt(count) + 1);
}

// Spread `nodes` across the disk of radius `r` centred at (cx, cy) using a
// golden-angle spiral — deterministic and roughly overlap-free.
function fillDisk(nodes: D3Node[], cx: number, cy: number, r: number): void {
  const n = nodes.length;
  nodes.forEach((node, i) => {
    const radius = n === 1 ? 0 : r * Math.sqrt((i + 0.5) / n);
    const angle = i * GOLDEN_ANGLE;
    node.x = cx + radius * Math.cos(angle);
    node.y = cy + radius * Math.sin(angle);
  });
}
