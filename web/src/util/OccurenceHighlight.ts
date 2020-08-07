import Prism from "prismjs";
import { Diff, Selection } from "@/api/api";

function mapToken(token: Prism.Token | string): Prism.Token {
  if (typeof token === "string") {
    return new Prism.Token("unmarked-token", token);
  } else if (Array.isArray(token.content)) {
    token.content = token.content.map(mapToken);
    return token;
  } else {
    return token;
  }
}

function flattenToken(token: Prism.Token): Prism.Token | Array<Prism.Token> {
  if (typeof token.content === "string") {
    return token;
  } else if (token.content instanceof Prism.Token) {
    return token.content;
  } else {
    return (token.content as Array<Prism.Token>).flatMap(flattenToken);
  }
}

const ID_START = "marked-code-block";

function constructID(isLeft: boolean, sel: Selection): string {
  return `${ID_START}-${isLeft ? "left" : "right"}-${sel.startRow}-${sel.startCol}-${sel.endRow}-${sel.endCol}`;
}

// TODO return all the ranges it belongs to since it can be more then one
function returnRangeId(diff: Diff, isLeft: boolean, row: number, col: number): string | null {
  for (const { left, right } of diff.fragments) {
    const { startRow, startCol, endRow, endCol } = isLeft ? left : right;
    console.log(row, col, startRow, startCol, endRow, endCol);
    const id = isLeft ? constructID(true, left) : constructID(false, right);
    if (startRow < row && row < endRow) {
      return id;
    } else if (row === startRow && startCol <= col) {
      if (row < endRow || (row === endRow && col < endCol)) {
        return id;
      }
    } else if (row === endRow && col < endCol) {
      return id;
    }
  }
  return null;
}

function blockClick(map: Map<string, Array<string>>, event: Event): void {
  let id: string | undefined;
  for (const entry of (event.target as HTMLElement).classList) {
    if (entry.startsWith(ID_START)) {
      id = entry;
      break;
    }
  }
  if (!id) {
    return;
  }
  const blocks = map.get(id) as Array<string>;

  const other = blocks.shift() as string;
  blocks.push(other);

  const visibleElements = document.querySelectorAll(".highlighted-code[class~=visible]") as NodeListOf<HTMLElement>;
  for (const visibleElement of visibleElements) {
    visibleElement.classList.remove("visible");
  }

  const leftBlock = document.querySelectorAll("." + id) as NodeListOf<HTMLElement>;
  const rightBlock = document.querySelectorAll("." + other) as NodeListOf<HTMLElement>;
  console.log("." + id);
  console.log("." + other);
  leftBlock.forEach(val => val.classList.add("visible"));
  rightBlock.forEach(val => val.classList.add("visible"));
  leftBlock[0].scrollIntoView({ behavior: "smooth" }); // TODO scroll to middle
  rightBlock[0].scrollIntoView({ behavior: "smooth" }); // TODO scroll to middle
}

export interface BlockHighlightingOptions {
  isLeftFile: boolean;
}

export function registerBlockHighlighting(diff: Diff, options: BlockHighlightingOptions): Map<string, Array<string>> {
  diff.fragments = diff.fragments.filter(fr => fr.left.startRow === 2 && fr.left.startCol === 18); // TODO remove
  const map = new Map<string, Array<string>>();
  for (const fragment of diff.fragments) {
    const leftId = constructID(true, fragment.left);
    const rightId = constructID(false, fragment.right);

    if (!map.has(leftId)) {
      map.set(leftId, []);
    }
    (map.get(leftId) as string[]).push(rightId);

    if (!map.has(rightId)) {
      map.set(rightId, []);
    }
    (map.get(rightId) as string[]).push(leftId);
  }

  function extractRowCol(value: string): [number, number] {
    const matches = /([0-9]*)-([0-9]*)-[0-9]*-[0-9]$/m.exec(value) as RegExpExecArray;
    return [+matches[1], +matches[2]];
  }

  for (const array of map.values()) {
    array.sort((el1, el2) => {
      const [row1, col1] = extractRowCol(el1);
      const [row2, col2] = extractRowCol(el2);
      const res = row1 - row2;
      if (res === 0) {
        return col1 - col2;
      } else {
        return res;
      }
    });
  }

  Prism.hooks.add("after-tokenize", function (arg) {
    const rootToken = new Prism.Token("root", arg.tokens.map(mapToken));
    arg.tokens.length = 0;
    arg.tokens.push(rootToken);

    const flatTree = arg.tokens.flatMap(flattenToken);
    let row = 0;
    let col = 0;
    for (const node of flatTree) {
      const content: string = node.content;
      const id = returnRangeId(diff, options.isLeftFile, row, col);
      console.log(id, content);
      if (id) {
        node.type += " highlighted-code " + id;
      }

      if (content.includes("\n")) {
        row += (content.match(/\n/g) || []).length;
        col = content.length - content.lastIndexOf("\n") - 1;
      } else {
        col += content.length;
      }
    }
  });

  let temp = 0;
  Prism.hooks.add("complete", env => {
    temp += 1;
    if (temp === 2) {
      (document.querySelectorAll(".highlighted-code") as NodeListOf<HTMLElement>).forEach(value => {
        value.addEventListener("click", ev => blockClick(map, ev));
      });
    }
  });

  return map; // TODO move map to Comparecard.vue
}
