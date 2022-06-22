import Prism from "prismjs";
import { Selection } from "@/api/models";

/**
 * Map all tokens to themselves and convert a string to a token of type "unmarked-token"
 * @param token The token that will be converted
 */
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

/**
 * Maps a token to itself if it has no children, to it's child if it has one child
 * or to an array of its children if it has multiple.
 * @param token the token that will be flattened
 */
function flattenToken(token: Prism.Token): Prism.Token | Array<Prism.Token> {
  if (typeof token.content === "string") {
    return token;
  } else if (token.content instanceof Prism.Token) {
    return token.content;
  } else {
    return (token.content as Array<Prism.Token>).flatMap(flattenToken);
  }
}

export const ID_START = "marked-code-fragment";

// all selection id have the following structure: marked-code-fragment-STARTROW-STARTCOL-ENDROW-ENDCOL where the rows
// and cols have been replace by their values
export type SelectionId = string;

/**
 * Construct an ad for the given selection
 * @param sel the selection that will be used to construct the id
 */
export function constructID(sel: Selection): SelectionId {
  return `${ID_START}-${sel.startRow}-${sel.startCol}-${sel.endRow}-${sel.endCol}`;
}

/**
 * Return all the ids of the selection that contant that row or col
 * @param selections All the possible selections
 * @param row the row
 * @param col the col
 */
function returnSelectionIds(selections: Array<Selection>, row: number, col: number): Array<SelectionId> {
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

/**
 * registers the needed hooks to mark all the given selections
 * @param selections the selection that need to be marked
 */
export function registerFragmentHighlighting(selections: Array<Selection>): void {
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
