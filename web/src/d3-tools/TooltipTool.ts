import * as d3 from "d3";
export class TooltipTool<T> {
  private div: d3.Selection<any, unknown, HTMLElement, any>;

  constructor(private getHtml: (a: T) => string) {
    // d3.select(".tooltip").remove();
    this.div = d3
      .select(".v-application--wrap")
      .append("div")
      .attr("class", "tooltip")
      .style("padding", "10px 18px")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("z-index", 1)
      .style("color", "white")
      .style("background-color", "rgba(59, 72, 80, 0.9)")
      .style("border", "1px solid")
      .style("color", "#fff")
      .style("box-shadow", "0px 0px 24px rgba(0, 0, 0, 0.2)")
      .style("border-radius", "6px")
      .style("font-size", "14px")
      .style("transform", "translateY(-100%)");
  }

  mouseEnter(o: MouseEvent, data: T, relativeToTarget = false): void {
    const target: HTMLElement | null = o.target as HTMLElement;
    const relativeX = scrollX + (target?.getBoundingClientRect().left || 0);
    const relativeY = scrollY + (target?.getBoundingClientRect().top || 0);

    const x = relativeToTarget ? relativeX : o.pageX;
    const y = relativeToTarget ? relativeY : o.pageY;

    this.div
      .style("left", x + "px")
      .style("top", y + "px")
      .style("opacity", 0.9)
      .html(this.getHtml(data));
  }

  mouseOut(): void {
    this.div.style("opacity", 0).style("left", 0).style("top", 0);
  }
}
