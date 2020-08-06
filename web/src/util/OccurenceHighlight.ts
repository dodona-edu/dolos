import Prism from "prismjs";
import { Diff, Hunk } from "@/api/api";

type PairedTextArrayIndices = [[number, number], string, [number, number], string]

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

function mapLinesToCumulativeCount(lines: Array<string>): Array<number> {
  let sum = 0;
  const temp = lines
    .map(line => line.length + 1)
    .map((value: number) => {
      sum += value;
      return sum;
    });
  temp.splice(0, 0, 0);
  return temp;
}
const ID_START = "marked-code-block";

function constructID(isLeft: boolean, start: number, end: number): string {
  return `${ID_START}-${isLeft ? "left" : "right"}-${start}-${end}`;
}

function returnRangeId(textArrayIndices: Array<PairedTextArrayIndices>, isLeft: boolean, index: number):
  string | null {
  for (const [left, leftId, right, rightId] of textArrayIndices) {
    const [start, end] = isLeft ? left : right;
    const id = isLeft ? leftId : rightId;
    if (start <= index && index <= end) {
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
  leftBlock.forEach(val => val.classList.add("visible"));
  rightBlock.forEach(val => val.classList.add("visible"));
  leftBlock[0].scrollIntoView({ behavior: "smooth" }); // TODO scroll to middle
  rightBlock[0].scrollIntoView({ behavior: "smooth" }); // TODO scroll to middle
}

export function registerBlockHighlighting(diff: Diff): Map<string, Array<string>> {
  const leftLines = mapLinesToCumulativeCount(diff.leftFile.content.split("\n"));
  const rightLines = mapLinesToCumulativeCount(diff.rightFile.content.split("\n"));

  function lineColToSerial(left: boolean, row: number, col: number): number {
    const lines = left ? leftLines : rightLines;
    return lines[row] + col;
  }

  function toTextArrayIndices(hunk: Hunk): PairedTextArrayIndices {
    const leftStart = lineColToSerial(true, hunk.left.startRow, hunk.left.startCol);
    const leftEnd = lineColToSerial(true, hunk.left.endRow, hunk.left.endCol);
    const rightStart = lineColToSerial(false, hunk.right.startRow, hunk.right.startCol);
    const rightEnd = lineColToSerial(false, hunk.right.endRow, hunk.right.endCol);
    return [
      [
        leftStart,
        leftEnd
      ],
      constructID(true, leftStart, leftEnd),
      [
        rightStart,
        rightEnd
      ],
      constructID(false, rightStart, rightEnd)
    ];
  }

  const textArrayIndices = diff.fragments.map(toTextArrayIndices);

  let isLeftFile = false;

  const map = new Map<string, Array<string>>();
  for (const [, leftId, , rightId] of textArrayIndices) {
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
    const matches = /([0-9]*)-([0-9]*)$/m.exec(value) as RegExpExecArray;
    return [+matches[1], +matches[2]];
  }
  for (const array of map.values()) {
    array.sort((el1, el2) => {
      const [start1, end1] = extractRowCol(el1);
      const [start2, end2] = extractRowCol(el2);
      const res = start1 - start2;
      if (res === 0) {
        return end1 - end2;
      } else {
        return res;
      }
    });
  }

  Prism.hooks.add("before-tokenize", function (arg) {
    isLeftFile = diff.leftFile.content === arg.code;
  });

  Prism.hooks.add("after-tokenize", function (arg) {
    const rootToken = new Prism.Token("root", arg.tokens.map(mapToken));
    arg.tokens.length = 0;
    arg.tokens.push(rootToken);

    const flatTree = arg.tokens.flatMap(flattenToken);
    let count = 0;
    for (const node of flatTree) {
      const id = returnRangeId(textArrayIndices, isLeftFile, count);
      if (id) {
        node.type += " highlighted-code " + id;
      }
      count += node.content.length;
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
