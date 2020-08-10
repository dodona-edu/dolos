import Prism from "prismjs";
import { Selection } from "@/api/api";

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

function constructID(sel: Selection): string {
  return `${ID_START}-${sel.startRow}-${sel.startCol}-${sel.endRow}-${sel.endCol}`;
}

function returnSelectionIds(selections: Array<Selection>, row: number, col: number): Array<string> {
  const ids: Set<string> = new Set();
  for (const selection of selections) {
    const { startRow, startCol, endRow, endCol } = selection;
    const id = constructID(selection);
    if (startRow < row && row < endRow) {
      ids.add(id);
    } else if (row === startRow && startCol <= col) {
      if (row < endRow || (row === endRow && col < endCol)) {
        ids.add(id);
      }
    } else if (row === endRow && col < endCol) {
      ids.add(id);
    }
  }
  return [...ids];
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

  const visibleElements = document.querySelectorAll(".marked-code[class~=visible]") as NodeListOf<HTMLElement>;
  for (const visibleElement of visibleElements) {
    visibleElement.classList.remove("visible");
  }

  const leftBlock = document.querySelectorAll("." + id) as NodeListOf<HTMLElement>;
  const rightBlock = document.querySelectorAll("." + other) as NodeListOf<HTMLElement>;
  leftBlock.forEach(val => val.classList.add("visible"));
  rightBlock.forEach(val => val.classList.add("visible"));
  leftBlock[0].scrollIntoView({ behavior: "smooth", block: "center" });
  rightBlock[0].scrollIntoView({ behavior: "smooth", block: "center" });
}

export function registerBlockHighlighting(selections: Array<Selection>): void {
  // const map = new Map<string, Array<string>>();
  // for (const fragment of diff.fragments) {
  //   const leftId = constructID(true, fragment.left);
  //   const rightId = constructID(false, fragment.right);
  //
  //   if (!map.has(leftId)) {
  //     map.set(leftId, []);
  //   }
  //   (map.get(leftId) as string[]).push(rightId);
  //
  //   if (!map.has(rightId)) {
  //     map.set(rightId, []);
  //   }
  //   (map.get(rightId) as string[]).push(leftId);
  // }

  // function extractRowCol(value: string): [number, number] {
  //   const matches = /([0-9]*)-([0-9]*)-[0-9]*-[0-9]*$/m.exec(value) as RegExpExecArray;
  //   return [+matches[1], +matches[2]];
  // }
  //
  // for (const array of map.values()) {
  //   array.sort((el1, el2) => {
  //     const [row1, col1] = extractRowCol(el1);
  //     const [row2, col2] = extractRowCol(el2);
  //     const res = row1 - row2;
  //     if (res === 0) {
  //       return col1 - col2;
  //     } else {
  //       return res;
  //     }
  //   });
  // }

  Prism.hooks.add("after-tokenize", function (arg) {
    console.log("here");
    const arr = arg.tokens.map(mapToken);
    arg.tokens.length = 0;
    arg.tokens.push(...arr);

    const flatTree = arg.tokens.flatMap(flattenToken);
    let row = 0;
    let col = 0;
    for (const node of flatTree) {
      const content: string = node.content;
      const ids = returnSelectionIds(selections, row, col);
      if (ids.length > 0) {
        node.type += " marked-code " + ids.join(" ");
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
    console.log("here");
    temp += 1;
    if (temp === 2) {
      (document.querySelectorAll(".marked-code") as NodeListOf<HTMLElement>).forEach(value => {
        value.addEventListener("click", ev => console.dir(ev));
      });
    }
  });
}
