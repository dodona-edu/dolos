import * as d3 from "d3";

export interface UseD3TooltipOptions {
  // If the tooltip should be relative to the target element.
  relativeToTarget?: boolean;
  // If the tooltip should be relative to the mouse.
  relativeToMouse?: boolean;
}

export function useD3Tooltip(options: UseD3TooltipOptions = {}): any {
  const tooltip = d3
    .select(".v-application--wrap")
    .append("div")
    .attr("class", "tooltip")
    .style("padding", "10px 18px")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("z-index", 1)
    .style("color", "white")
    .style("background-color", "rgba(0, 0, 0, 0.7)")
    .style("color", "#fff")
    .style("border", "1px solid")
    .style("border-radius", "4px")
    .style("transform", "translateY(-100%)");

  // Move the tooltip to the desired coordinates.
  const move = (e: MouseEvent): void => {
    const target: HTMLElement | null = e.target as HTMLElement;

    let x = 0;
    let y = 0;

    // If the tooltip should be relative to the target element.
    if (options.relativeToTarget) {
      const relativeX = scrollX + (target?.getBoundingClientRect().left || 0);
      const relativeY = scrollY + (target?.getBoundingClientRect().top || 0);

      x = relativeX;
      y = relativeY;
    }

    // If the tooltip should be relative to the mouse.
    if (options.relativeToMouse) {
      x = e.pageX;
      y = e.pageY;
    }

    tooltip
      .style("left", x + "px")
      .style("top", y + "px");
  };

  // When the user starts hovering over an element.
  const onMouseOver = (e: MouseEvent, value: string): void => {
    move(e);

    tooltip
      .style("opacity", 0.9)
      .html(value);
  };

  // When the user moves the mouse.
  const onMouseMove = (e: MouseEvent): void => {
    move(e);
  };

  // When the user stops hovering over an element.
  const onMouseOut = (): void => {
    tooltip
      .style("opacity", 0)
      .style("left", 0)
      .style("top", 0);
  };

  return {
    tooltip,
    onMouseOver,
    onMouseMove,
    onMouseOut
  };
}
