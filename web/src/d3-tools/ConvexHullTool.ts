import * as d3 from "d3";

type Coordinate = {x: number, y:number};
type Coordinates = Coordinate[];
const toD3Coordinate = (c: Coordinate): [number, number] => [c.x, c.y];
const toD3Coordinates = (c: Coordinates): [number, number][] => c.map(toD3Coordinate);

type OnClickHandler<T> = ((c: T, coordinates: Coordinates) => void);
export class ConvexHullTool<T> {
  private canvas: d3.Selection<d3.BaseType, null, d3.BaseType, unknown>;

  private readonly onClick: OnClickHandler<T> | null;

  constructor(canvas: d3.Selection<d3.BaseType, null, d3.BaseType, unknown>, onClick: OnClickHandler<T> | null = null) {
    this.canvas = canvas;
    this.onClick = onClick;
  }

  addConvexHullFromNodes(coordinates: Coordinates, color = "red", data: T): void {
    const d3Coordinates = toD3Coordinates(coordinates);
    let polygon;

    if (d3Coordinates.length > 2) {
      polygon = d3.polygonHull(d3Coordinates)!;
      polygon.push(polygon[0]);
      polygon.push(polygon[1]);
    } else if (d3Coordinates.length === 2) {
      polygon = d3Coordinates;
    } else {
      return;
    }

    const group: any = d3.select(".polygons").node()
      ? d3.select(".polygons")
      : this.canvas.append("g")
        .attr("class", "polygons");

    const path = group.append("path")
      .attr("d", d3.line()(polygon))
      .style("stroke", color)
      .style("fill", color)
      .style("stroke-width", 15)
      .style("stroke-opacity", 0.1)
      .style("fill-opacity", 0.05)
      .attr("stroke-linejoin", "round");

    path.on("mousedown", (e: Event) => {
      if (this.onClick) { this.onClick(data, coordinates); }
      e.preventDefault();
      e.stopPropagation();
    });
  }

  clear(): void {
    d3.selectAll(".polygons").remove();
    const group: any = this.canvas.insert("g", "g")
      .attr("class", "polygons");

    group.selectAll("path").remove();
  }
}
