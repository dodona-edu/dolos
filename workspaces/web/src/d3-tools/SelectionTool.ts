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
  private dragging = false;
  private draggingStartedPoint = 0;
  private selected = false;

  constructor(
    private svg: d3.Selection<SVGSVGElement, T, HTMLElement, unknown>,
    private data: T[],
    private size: () => SvgSize,
    private selectionListener: SelectionListener<T>,
    private selectionMargin = 10,
  ) {
    this.initalizeOnHover();
  }

  private initalizeOnHover(): void {
    this.svg
      .append("line")
      .attr("class", "selectionLine1")
      .attr("stroke", "black")
      .attr("visibility", "hidden");
    this.svg
      .append("line")
      .attr("class", "selectionLine2")
      .attr("stroke", "black")
      .attr("visibility", "hidden");

    this.svg
      .append("rect")
      .attr("class", "selectionSquare")
      .attr("visibility", "hidden")
      .attr("fill", "black")
      .attr("fill-opacity", 0.1)
      .attr("width", 150)
      .attr("height", this.size().height);

    this.svg.on("mousemove", o => {
      this.onMouseMove(o);
    });

    this.svg.on("mousedown", (o) => {
      this.dragging = true;
      this.selected = false;
      this.draggingStartedPoint = d3.pointer(o)[0];
    });

    this.svg.on("mouseup", o => {
      this.dragging = false;
      this.selected = true;

      // On click (we determine by how much the mouse moved) we reset the selection
      const coord = d3.pointer(o)[0];
      if (Math.abs(coord - this.draggingStartedPoint) < 5) {
        this.selected = false;
        this.svg.select(".selectionSquare").attr("visibility", "hidden");
        this.svg.select(".selectionLine2").attr("visibility", "hidden");
        this.onMouseMove(o);
        this.selectionListener([]);
      }
    });

    this.svg.on("mouseleave", () => {
      if (!this.selected) { this.svg.select(".selectionLine1").attr("visibility", "hidden"); }
    });
  }

  private onMouseMove(o: Event): void {
    if (!this.dragging && !this.selected) {
      this.onHover(o);
    } else if (!this.selected) {
      this.onDrag(o);
    }
  }

  private onHover(o: Event): void {
    const xCoord = d3.pointer(o)[0];
    this.svg
      .select(".selectionLine1")
      .attr("x1", xCoord)
      .attr("y1", 0)
      .attr("x2", xCoord)
      .attr("y2", this.size().height)
      .attr("visibility", "visible");
    // this.selectionListener(this.getSelectionData(xCoord - this.selectionMargin, xCoord + this.selectionMargin));
  }

  private onDrag(o: Event): void {
    const xCoord = d3.pointer(o)[0];

    this.svg
      .select(".selectionLine1")
      .attr("x1", this.draggingStartedPoint)
      .attr("x2", this.draggingStartedPoint)
      .attr("visibility", "visible");

    this.svg
      .select(".selectionLine2")
      .attr("x1", xCoord)
      .attr("y1", 0)
      .attr("x2", xCoord)
      .attr("y2", this.size().height)
      .attr("visibility", "visible");

    this.svg
      .select(".selectionSquare")
      .attr("x", Math.min(xCoord, this.draggingStartedPoint))
      .attr("width", Math.abs(xCoord - this.draggingStartedPoint))
      .attr("visibility", "visible");

    this.selectionListener(
      this.getSelectionData(Math.min(xCoord, this.draggingStartedPoint), Math.max(xCoord, this.draggingStartedPoint))
    );
  }

  private getSelectionData(minCoord: number, maxCoord: number): T[] {
    const x = (d: T): number => d.x || 0;
    return this.data.filter(
      d => x(d) > minCoord - this.size().margin.left &&
        x(d) < maxCoord - this.size().margin.left);
  }
}
