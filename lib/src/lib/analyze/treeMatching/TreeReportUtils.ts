import { SyntaxNode, Tree } from "tree-sitter";
import { Hash } from "../treeIndex";
import { breadthFirstWalkForest, getKey } from "./treeUtils";
import { SharedFingerprint } from "../sharedFingerprint";
import { TokenizedFile } from "../../file/tokenizedFile";
import { ScoredPairs } from "../reportInterface";
import { SimplePair } from "../simplePair";
import { buildSimpleFragment } from "../simpleFragmentBuilder";

export function mapHashToNodeList(
  forest: Tree[],
  nodeToHash: Map<SyntaxNode, Hash>
): Map<Hash, Array<SyntaxNode>> {
  const numberToNodeList: Map<number, SyntaxNode[]> = new Map();

  for (const node of breadthFirstWalkForest(forest)) {
    // // leave matches are not useful information
    // if(node.childCount == 0) {
    //   continue;
    // }
    const integer: Hash = nodeToHash.get(node) as Hash;
    const matchedNodes = numberToNodeList.get(integer);
    if (matchedNodes !== undefined) {
      matchedNodes.push(node);
    } else {
      numberToNodeList.set(integer, [node]);
    }
  }
  return numberToNodeList;
}

export function mapHashToFingerprint(hashes: Set<Hash>): Map<Hash, SharedFingerprint> {
  const hashToFingerprint: Map<Hash, SharedFingerprint> = new Map();
  for (const hash of hashes.values()) {
    const fingerPrint = new SharedFingerprint(hash, null);
    hashToFingerprint.set(hash, fingerPrint);
  }
  return hashToFingerprint;
}

export function makeScoredPairs(
  filteredGroup: SyntaxNode[][],
  hashToFingerprint: Map<Hash, SharedFingerprint>,
  nodeMappedToFile: Map<SyntaxNode, TokenizedFile>,
  nodeToHash: Map<SyntaxNode, Hash>
): Array<ScoredPairs> {
  const pairs: Array<ScoredPairs> = [];
  const pairDict: Map<string, SimplePair> = new Map();
  for (const group of filteredGroup) {
    const hash = nodeToHash.get(group[0]) as Hash;
    const fingerprint = hashToFingerprint.get(hash) as SharedFingerprint;
    // console.log("new group");
    for (let i = 0; i < group.length; i += 1) {
      const leftNode = group[i];
      const leftFile = nodeMappedToFile.get(leftNode) as TokenizedFile;
      for (let j = i + 1; j < group.length; j += 1) {
        const rightNode = group[j];
        const rightFile = nodeMappedToFile.get(rightNode) as TokenizedFile;
        const key = getKey(leftFile, rightFile);
        let pair;
        if (pairDict.has(key)) {
          pair = pairDict.get(key) as SimplePair;
        } else {
          pair = new SimplePair(
            leftFile,
            rightFile,
            []
          );
          pairDict.set(key, pair);
        }
        const fragment = buildSimpleFragment(leftNode, rightNode, fingerprint);
        pair.fragmentList.push(fragment);
      }
    }
    // console.log("new group");
    // for (const node of group) {
    //   // const pair = new SimplePair()
    //   let str = "\t";
    //   str += `{from: [${node.startPosition.row + 1}, ${node.startPosition.column}]`;
    //   str += `, to: [${node.endPosition.row + 1}, ${node.endPosition.column}]}: => ${nodeMappedToFile.get(node)}`;
    //   console.log(str);
    // }
    // console.log("");
  }

  // console.log(pairDict);
  for (const pair of pairDict.values()) {
    pairs.push({
      pair: pair,
      similarity: 0,
      longest: 0,
      overlap: 0,
    });
  }
  return pairs;
}
