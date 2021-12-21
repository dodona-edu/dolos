import { FragmentInterface } from "./fragmentInterface";
import { SyntaxNode } from "tree-sitter";
import { Region } from "../util/region";
import { Range } from "../util/range";
import { SharedFingerprint } from "./sharedFingerprint";
import { ASTRegionInterface, PairedOccurrenceInterface } from "./pairedOccurrence";

function nodeToRegion(node: SyntaxNode): Region {
  return new Region(
    node.startPosition.column,
    node.startPosition.row,
    node.endPosition.column,
    node.endPosition.row
  );
}

function nodeToRange(node: SyntaxNode): Range {
  return new Range(node.startIndex, node.endIndex);
}

function nodeToAstRegion(node: SyntaxNode): ASTRegionInterface {
  return {
    start: node.startIndex,
    stop: node.endIndex,
    index: Math.round((node.startIndex + node.startIndex) / 2)
  };
}

export function buildSimpleFragment(
  leftNode: SyntaxNode,
  rightNode: SyntaxNode,
  fingerprint: SharedFingerprint
): FragmentInterface {
  const pairedOccurenceInterface: PairedOccurrenceInterface = {
    left: nodeToAstRegion(leftNode),
    right: nodeToAstRegion(rightNode),
    fingerprint: fingerprint
  };

  return {
    mergedData: null,
    pairs: [pairedOccurenceInterface],
    leftSelection: nodeToRegion(leftNode),
    rightSelection: nodeToRegion(rightNode),
    leftkgrams: nodeToRange(leftNode),
    rightkgrams: nodeToRange(rightNode)
  };
}
