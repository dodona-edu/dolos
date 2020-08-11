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

export const ID_START = "marked-code-block";

export function constructID(sel: Selection): string {
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

export function registerBlockHighlighting(selections: Array<Selection>): void {
  let executed = false;
  Prism.hooks.add("after-tokenize", function (arg) {
    // each hook instance can only run once otherwise a hook, once registered, will run for every page with it's
    // corresponding selections. Selections that could be from another page altogether.
    if (executed) {
      return;
    }
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
    executed = true;
  });
}
