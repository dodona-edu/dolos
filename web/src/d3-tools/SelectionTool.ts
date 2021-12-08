import * as d3 from "d3";
type SelectionListener<T> = (data: T[]) => void;

export interface xCoord {
  x?: number
}

interface SvgSize {
  width: number,
  height: number,
  margin: {left: number, right: number, top: number, bottom: number}
}

export class SelectionTool<T extends xCoord> {
  constructor(
    private svg: d3.Selection<SVGSVGElement, T, HTMLElement, unknown>,
    private data: T[],
    private size: () => SvgSize,
    private selectionListener: SelectionListener<T>,
    private selectionMargin = 10
  ) {
    this.initalizeOnHover();
  }

  private initalizeOnHover(): void {
    this.svg
      .append("line")
      .attr("class", "selectionLine1")
      .attr("stroke", "black")
      .attr("visibility", "hidden");

    this.svg.on("mousemove", o => {
      const xCoord = d3.pointer(o)[0];
      this.svg
        .select(".selectionLine1")
        .attr("x1", xCoord)
        .attr("y1", 0)
        .attr("x2", xCoord)
        .attr("y2", this.size().height)
        .attr("visibility", "visible");
      this.selectionListener(this.getSelectionData(xCoord));
    });

    this.svg.on("mouseleave", () => {
      this.svg.select(".selectionLine1").attr("visibility", "hidden");
    });
  }

  private getSelectionData(xCoord: number): T[] {
    const x = (d: T): number => d.x || 0;
    return this.data.filter(
      d => x(d) > xCoord - this.selectionMargin - this.size().margin.left &&
      x(d) < xCoord + this.selectionMargin - this.size().margin.left);
  }
}
