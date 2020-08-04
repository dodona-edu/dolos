import Prism from "prismjs";

// This file is a modified copy of primsjs's prism-line-highlight plugins which exposes utility functions

function hasClass(element: Element, className: string): boolean {
  const className2 = " " + className + " ";
  return (" " + element.className + " ").replace(/[\n\t]/g, " ").indexOf(className2) > -1;
}

function callFunction(func: () => any): void {
  func();
}

// Some browsers round the line-height, others don't.
// We need to test for it to position the elements properly.
const isLineHeightRounded = (function (): any {
  let res: any;
  return function () {
    if (typeof res === "undefined") {
      const d: any = document.createElement("div");
      d.style.fontSize = "13px";
      d.style.lineHeight = "1.5";
      d.style.padding = 0;
      d.style.border = 0;
      d.innerHTML = "&nbsp;<br />&nbsp;";
      document.body.appendChild(d);
      // Browsers that round the line-height should have offsetHeight === 38
      // The others should have 39.
      res = d.offsetHeight === 38;
      document.body.removeChild(d);
    }
    return res;
  };
}());

export interface HighlightOptions {
  classes?: string;
  id?: string;
  style?: string;
  callback?: (event: Event) => void;
}

/**
 * Highlights the lines of the given pre.
 *
 * This function is split into a DOM measuring and mutate phase to improve performance.
 * The returned function mutates the DOM when called.
 *
 * @param {HTMLElement} pre
 * @param {string} linesString
 * @param {HighlightOptions} [options]
 * @returns {() => void}
 */
export function highlightLines(pre: HTMLElement, linesString?: string, options: HighlightOptions = {}): () => void {
  const lines = typeof linesString === "string" ? linesString : (pre.getAttribute("data-line") as string);

  // @ts-ignore
  const ranges = lines.replace(/\s+/g, "").split(",");
  // @ts-ignore
  const offset = +pre.getAttribute("data-line-offset") || 0;

  const parseMethod = isLineHeightRounded() ? parseInt : parseFloat;
  const lineHeight = parseMethod(getComputedStyle(pre).lineHeight);
  const hasLineNumbers = hasClass(pre, "line-numbers");
  const parentElement = hasLineNumbers ? pre : pre.querySelector("code") || pre;
  const mutateActions: any = /** @type {(() => void)[]} */ ([]);

  ranges.forEach(function (currentRange: any) {
    const range = currentRange.split("-");

    const start = +range[0];
    const end = +range[1] || start;

    const line: HTMLElement = pre.querySelector(".line-highlight[data-range=\"" + currentRange + "\"]") ||
      document.createElement("div");

    if (options.callback) {
      line.addEventListener("click", options.callback);
    }

    mutateActions.push(function () {
      line.setAttribute("aria-hidden", "true");
      line.setAttribute("data-range", currentRange);
      line.className = (options.classes || "") + " line-highlight";
      if (options.id) {
        line.id = options.id;
      }
      if (options.style) {
        line.style.cssText += options.style;
      }
    });

    // if the line-numbers plugin is enabled, then there is no reason for this plugin to display the line numbers
    if (hasLineNumbers && Prism.plugins.lineNumbers) {
      const startNode = Prism.plugins.lineNumbers.getLine(pre, start);
      const endNode = Prism.plugins.lineNumbers.getLine(pre, end);

      if (startNode) {
        const top = startNode.offsetTop + "px";
        mutateActions.push(function () {
          line.style.top = top;
        });
      }

      if (endNode) {
        const height = (endNode.offsetTop - startNode.offsetTop) + endNode.offsetHeight + "px";
        mutateActions.push(function () {
          line.style.height = height;
        });
      }
    } else {
      mutateActions.push(function () {
        line.setAttribute("data-start", start.toString());

        if (end > start) {
          line.setAttribute("data-end", end.toString());
        }

        line.style.top = (start - offset - 1) * lineHeight + "px";

        line.textContent = new Array(end - start + 2).join(" \n");
      });
    }

    mutateActions.push(function () {
      // allow this to play nicely with the line-numbers plugin
      // need to attack to pre as when line-numbers is enabled, the code tag is relatively which screws up
      // the positioning
      parentElement.appendChild(line);
    });
  });

  return function () {
    mutateActions.forEach(callFunction);
  };
}
