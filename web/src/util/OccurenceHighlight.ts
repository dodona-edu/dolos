import Prism from "prismjs";
import { Diff, Hunk } from "@/api/api";

export function registerBlockHighlighting(diff: Diff): void {
  // let tree: Array<Node>;
  interface Token {
    type: string;
    content: string | Array<Token>;
    length: number;
  }

  interface Node {
    content: string | Array<Node>;
    highlighted: boolean;
  }

  // function mapToken(token: Token | string): Node {
  //   if (typeof token === "string") {
  //     return {
  //       content: token,
  //       highlighted: false
  //     };
  //   } else if (Array.isArray(token.content)) {
  //     return {
  //       content: token.content.map(mapToken),
  //       highlighted: false
  //     };
  //   } else {
  //     return {
  //       content: token.content as string,
  //       highlighted: false
  //     };
  //   }
  // }

  function mapTokenToToken(token: Prism.Token | string): Prism.Token {
    if (typeof token === "string") {
      return new Prism.Token("whitespace", token);
    } else if (Array.isArray(token.content)) {
      token.content = token.content.map(mapTokenToToken);
      return token;
    } else {
      return token;
    }
  }

  // function flattenNode(node: Node): Node | Array<Node> {
  //   if (typeof node.content === "string") {
  //     return node;
  //   } else {
  //     return node.content.flatMap(flattenNode);
  //   }
  // }

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
  const leftLines = mapLinesToCumulativeCount(diff.leftFile.content.split("\n"));
  const rightLines = mapLinesToCumulativeCount(diff.rightFile.content.split("\n"));

  function lineColToSerial(left: boolean, row: number, col: number): number {
    const lines = left ? leftLines : rightLines;
    console.log(left, row, col, lines[row], lines[row] + col);
    return lines[row] + col;
  }

  type PairedTextArrayIndices = [[number, number], [number, number]]

  function toTextArrayIndices(hunk: Hunk): PairedTextArrayIndices {
    return [
      [
        lineColToSerial(true, hunk.left.startRow, hunk.left.startCol),
        lineColToSerial(true, hunk.left.endRow, hunk.left.endCol),
      ],
      [
        lineColToSerial(false, hunk.right.startRow, hunk.right.startCol),
        lineColToSerial(false, hunk.right.endRow, hunk.right.endCol),
      ]
    ];
  }

  function inAnyRange(textArrayIndices: Array<PairedTextArrayIndices>, isLeft: boolean, index: number): boolean {
    for (const [left, right] of textArrayIndices) {
      const [start, end] = isLeft ? left : right;
      if (start <= index && index <= end) {
        return true;
      }
    }
    return false;
  }

  let isLeftFile = false;

  Prism.hooks.add("before-tokenize", function (arg) {
    isLeftFile = diff.leftFile.content === arg.code;
  });

  Prism.hooks.add("after-tokenize", function (arg) {
    const rootToken = new Prism.Token("root", arg.tokens.map(mapTokenToToken));
    arg.tokens.length = 0;
    arg.tokens.push(rootToken);

    // tree = arg.tokens.slice().map(mapToken);
    // const flatTree = tree.flatMap(flattenNode);
    const flatTree = arg.tokens.flatMap(flattenToken);
    const textArrayIndices = diff.fragments.map(toTextArrayIndices);
    let count = 0;
    console.log(textArrayIndices);
    for (const node of flatTree) {
      if (inAnyRange(textArrayIndices, isLeftFile, count)) {
        node.type += " highlighted-code";
      }
      count += node.content.length;
    }
  });

  // function filterContent(content: string): string {
  //   return content.replaceAll(/<span [^>]*>[^<]*<\/span>/g, "");
  // }
  // let tempArg: Prism.hooks.RequiredEnvironment<"type" | "content" | "tag" | "classes" | "attributes" | "language",
  //   Prism.Environment>;
  // let num = 0;
  // Prism.hooks.add("wrap", function (arg) {
  //   // this function needs all the ranges that need to be selected, which is not available at import time
  //   // so this function will have to be imported as soon as the data is available but before the code is highlighted
  //   // joy
  //   if (arg.type === "punctuation") {
  //     tempArg.classes.push("highlighted-code");
  //   }
  //   num += arg.content.length;
  //   console.log("arg", num, arg.content, "::FILTERED::", filterContent(arg.content));
  //   tempArg = arg;
  // });
}
