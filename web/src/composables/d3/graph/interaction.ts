import { Simulation } from "@/composables/d3/graph/simulation";
import { Group, Node, D3Node, Data } from "@/composables/d3/graph/data";
import { useD3Tooltip } from "@/composables";
import * as d3 from "d3";
import { ShallowRef } from "vue";

export function createTooltips(
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

export function createDrag(simulation: Simulation): d3.DragBehavior<HTMLCanvasElement, D3Node, unknown> {
  let startX: number;
  let startY: number;

  return d3.drag<HTMLCanvasElement, D3Node>()
    .subject((event) => simulation.findNode(event.sourceEvent.offsetX, event.sourceEvent.offsetY)!)
    .on("start", (event) => {
      startX = event.subject.x;
      startY = event.subject.y;
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    })
    .on("drag", (event) => {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
      simulation.reheat();
    })
    .on("end", (event) => {
      const dx = event.x - startX;
      const dy = event.y - startY;
      if (dx*dx + dy*dy > 1 && !event.active && !simulation.paused.value) simulation.reheat();
      event.subject.fx = null;
      event.subject.fy = null;
    });
}

export function createSelect(
  data: Data,
  simulation: Simulation,
  selectedNode: ShallowRef<Node | undefined>,
  selectedCluster: ShallowRef<Group | undefined>,
  onNodeClick?: (node: Node) => void
): (s: d3.Selection<HTMLCanvasElement, D3Node, null, undefined>) => void {
  return (canvas: d3.Selection<HTMLCanvasElement, D3Node, null, undefined>) => {
    canvas
      .on("click", (event) => {
        const node = simulation.findNode(event.offsetX, event.offsetY, 30);
        if (node) {
          selectedNode.value = node;
          selectedCluster.value = node.group;
          data.selectedNode = node;
          data.selectedGroup = node.group;
          if (onNodeClick) onNodeClick(node);
        } else {
          data.selectedNode = undefined;
          data.selectedGroup = undefined;
          selectedNode.value = undefined;
          selectedCluster.value = undefined;
        }
        simulation.redraw();
      });
  };
}
