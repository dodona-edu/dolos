import { Data } from "@/composables/d3/graph/data";
import * as d3 from "d3";

/**
 * Whiten a color by a given amount, where 0 is no change and 1 is fully white.
 */
function whiten(color: string, amount: number): string {
  const c = d3.hsl(color);
  c.l += (1 - c.l) * amount;
  return c.formatRgb();
}

export function draw(context: CanvasRenderingContext2D, data: Data): void {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  context.save();
  context.translate(context.canvas.width / 2, context.canvas.height / 2);

  for (const group of data.groups) {
    const color = whiten(group.color, data.selectedGroup == group ? 0.5 : .75);
    if (group.hull.length > 0) {
      context.beginPath();
      context.moveTo(group.hull[0][0], group.hull[0][1]);
      for (const point of group.hull) {
        context.lineTo(point[0], point[1]);
      }
      context.closePath();
      context.fillStyle = color;
      context.fill();
      context.lineWidth = 25;
      context.lineJoin = "round";
      context.strokeStyle = color;
      context.stroke();
    }
  }

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
    context.lineWidth = 1;
    context.strokeStyle = data.selectedNode == node ? "#000" : "#fff";
    context.stroke();
  }

  context.restore();
}
