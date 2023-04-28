import * as d3 from "d3";
import { shallowRef } from "vue";
import { Coordinate, Coordinates } from "@/api/models";
import { useD3Tooltip } from "./useD3Tooltip";

const toD3Coordinate = (c: Coordinate): [number, number] => [c.x, c.y];
const toD3Coordinates = (c: Coordinates): [number, number][] => c.map(toD3Coordinate);

export interface UseD3HullToolOptions<T> {
  // Canvas to add the hull to.
  canvas: any;
  // Should the tooltip be shown.
  showTooltip: boolean;
  // Click handler when the hull is clicked.
  onClick?: (data: T) => void;
}

export interface UseD3HullToolReturn<T> {
  add: (coordinates: Coordinates, data: T, color: string) => void;
  clear: () => void;
}

export function useD3HullTool<T>(options: UseD3HullToolOptions<T>): UseD3HullToolReturn<T> {
  // Group for storing the hulls.
  const group = shallowRef(options.canvas.append("g").attr("class", "polygons"));
  // Tooltip
  const tooltip = useD3Tooltip({ relativeToMouse: true });

  // Add a hull to the canvas for the given coordinates.
  const add = (coordinates: Coordinates, data: T, color: string): void => {
    const d3Coordinates = toD3Coordinates(coordinates);

    // Do not create polygons for singletons.
    if (d3Coordinates.length < 2) return;

    // D3 polygons do not work with less than 3 points.
    // In order to use the polygon hull fake points are generated
    if (d3Coordinates.length === 2) {
      const point1 = d3Coordinates[0];
      const point2 = d3Coordinates[1];

      d3Coordinates.push([point1[0] - 0.001, point1[1] + 0.001]);
      d3Coordinates.push([point2[0] + 0.001, point2[1] - 0.001]);
    }

    const polygon = d3.polygonHull(d3Coordinates);
    if (!polygon) return;
    polygon.push(polygon[0]);
    polygon.push(polygon[1]);

    const group = d3.select(".polygons");
    const path = group
      .append("path")
      .attr("d", d3.line()(polygon))
      .style("opacity", 0.1)
      .style("fill", color)
      .style("stroke", color)
      .style("stroke-width", 25)
      .attr("stroke-linejoin", "round")
      .style("cursor", "pointer")
      .on("mouseover", (e: MouseEvent) => options.showTooltip && tooltip.onMouseOver(e, "Click to view cluster"))
      .on("mousemove", (e: MouseEvent) => options.showTooltip && tooltip.onMouseMove(e))
      .on("mouseleave", (e: MouseEvent) => options.showTooltip && tooltip.onMouseOut(e));

    path.on("mousedown", (e: Event) => {
      e.preventDefault();
      e.stopPropagation();

      if (options.onClick) {
        options.onClick(data);
      }
    });
  };

  // Clear all hulls from the canvas.
  const clear = (): void => {
    d3.selectAll(".polygons").remove();

    group.value = options.canvas.insert("g", "g")
      .attr("class", "polygons")
      .selectAll("path").remove();
  };

  return {
    add,
    clear
  };
}
