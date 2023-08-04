import * as d3 from "d3";
import { onUnmounted } from "vue";

export interface UseD3TooltipOptions {
  // If the tooltip should be relative to the target element.
  relativeToTarget?: boolean;
  // If the tooltip should be relative to the mouse.
  relativeToMouse?: boolean;
  parent?: HTMLElement;
}

export interface UseD3TooltipReturn {
  tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
  show: (value: string) => void;
  hide: () => void;
  moveTo: (x: number, y: number) => void;
  onMouseOver: (event: MouseEvent, value: string) => void;
  onMouseOut: (event: MouseEvent) => void;
  onMouseMove: (event: MouseEvent) => void;
}

export function useD3Tooltip(options: UseD3TooltipOptions = {}): UseD3TooltipReturn {
  let parent: d3.Selection<HTMLDivElement, unknown, any, any>;
  if (options.parent) {
    parent = d3.select(options.parent).append("div");
  } else {
    parent = d3.select(".v-overlay-container").append("div");
  }

  const tooltip =
    parent
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("background-color", "rgba(25, 25, 25, 0.8)")
      .style("color", "white")
      .style("border-radius", "5px")
      .style("padding", "5px")
      .style("font-size", "14px")
      .style("position", "absolute")
      .style("z-index", 5)
      .style("transform", "translateY(-100%)")
      .style("pointer-events", "none");

  const moveTo = (x: number, y: number): void => {
    tooltip
      .style("left", x + "px")
      .style("top", y + "px");
  };

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

    moveTo(x, y);
  };

  const show = (value: string): void => {
    tooltip
      .style("opacity", 1)
      .html(value);
  };

  const hide = (): void => {
    tooltip.style("opacity", 0);
  };

  // When the user starts hovering over an element.
  const onMouseOver = (e: MouseEvent, value: string): void => {
    move(e);
    show(value);
  };

  // When the user moves the mouse.
  const onMouseMove = (e: MouseEvent): void => {
    move(e);
  };

  // When the user stops hovering over an element.
  const onMouseOut = (): void => {
    hide();
    moveTo(0, 0);
  };

  // Hide the tooltip on unmount.
  onUnmounted(() => onMouseOut());

  return {
    tooltip,
    show,
    hide,
    moveTo,
    onMouseOver,
    onMouseMove,
    onMouseOut
  };
}
