import { SyntaxNode, Tree } from "tree-sitter";
import { Hash } from "../treeIndex";
import { breadthFirstWalk, breadthFirstWalkForest, getKey} from "./treeUtils";
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

export function mapHashToSharedFingerprint(hashes: Set<Hash>): Map<Hash, SharedFingerprint> {
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
  nodeToHash: Map<SyntaxNode, Hash>,
  nodeToTreeSize: Map<SyntaxNode, number>
): Array<ScoredPairs> {
  const pairs: Array<ScoredPairs> = [];
  const pairDict: Map<string, SimplePair> = new Map();
  const pairToNodePairs: Map<string, Array<[SyntaxNode, SyntaxNode]>> = new Map();
  for (const group of filteredGroup) {
    const hash = nodeToHash.get(group[0]) as Hash;
    let fingerprint = hashToFingerprint.get(hash) as SharedFingerprint;
    // TODO figure out shared fingerprint for near miss groups, which don't share a isomorphic tree "hash"
    if(!fingerprint) {
      const dummyHash = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
      fingerprint = new SharedFingerprint(dummyHash, null);
    }
    // console.log("new group");
    for (let i = 0; i < group.length; i += 1) {
      const leftNode = group[i];
      const leftFile = nodeMappedToFile.get(leftNode) as TokenizedFile;
      for (let j = i + 1; j < group.length; j += 1) {
        const rightNode = group[j];
        const rightFile = nodeMappedToFile.get(rightNode) as TokenizedFile;
        const key = getKey(leftFile, rightFile);
        let pair;
        let nodePairList: Array<[SyntaxNode, SyntaxNode]>;
        if (pairDict.has(key)) {
          pair = pairDict.get(key) as SimplePair;
          nodePairList = pairToNodePairs.get(key) as Array<[SyntaxNode, SyntaxNode]>;
        } else {
          pair = new SimplePair(
            leftFile,
            rightFile,
            []
          );
          nodePairList = [];
          pairToNodePairs.set(key, nodePairList);
          pairDict.set(key, pair);
        }
        if (leftFile.id < rightFile.id) {
          nodePairList.push([leftNode,  rightNode]);
        } else {
          nodePairList.push([rightNode, leftNode]);
        }
        let fragment;
        if(pair.leftFile.id == leftFile.id && pair.rightFile.id == rightFile.id) {
          fragment = buildSimpleFragment(leftNode, rightNode, fingerprint);
        } else if (pair.leftFile.id == rightFile.id && pair.rightFile.id == leftFile.id) {
          fragment = buildSimpleFragment(rightNode, leftNode, fingerprint);
        } else {
          throw new Error("received pair does not match required pair");
        }
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
  for (const [key, pair] of pairDict.entries()) {

    let longest = 0;
    let total = 0;
    for(const fragment of pair.fragmentList) {
      let length = fragment.leftSelection.endRow - fragment.leftSelection.startRow;
      total += length;
      if(length > longest) {
        longest = length;
      }
      length = fragment.rightSelection.endRow - fragment.rightSelection.startRow;
      total += length;
      if(length > longest) {
        longest = length;
      }
    }
    pairs.push({
      pair: pair,
      similarity: getSimilarity(pairToNodePairs.get(key) as Array<[SyntaxNode, SyntaxNode]>, nodeToTreeSize),
      longest: longest,
      overlap: total,
    });
  }
  return pairs;
}

function totalCovered(nodes: Array<SyntaxNode>): number {
  const seenSet = new Set();
  let count = 0;
  for( const node of nodes) {
    for(const descendant of breadthFirstWalk(node)) {
      if(seenSet.has(descendant)) {
        continue;
      }
      count += 1;
      seenSet.add(descendant);
    }
  }
  return count;
}


function getSimilarity(nodePairList: Array<[SyntaxNode, SyntaxNode]>, nodeToTreeSize: Map<SyntaxNode, number>): number {
  // const leftCountMap = getCountMap()
  const [tempLeft, tempRight] = nodePairList[0];
  const leftRoot = tempLeft.tree.rootNode;
  const rightRoot = tempRight.tree.rootNode;

  const leftTotal = nodeToTreeSize.get(leftRoot) as number;
  const rightTotal = nodeToTreeSize.get(rightRoot) as number;

  const leftCount = totalCovered(nodePairList.map(([_rightNode, leftNode]) => leftNode));
  const rightCount = totalCovered(nodePairList.map(([rightNode, _leftNode]) => rightNode));


  return (rightCount + leftCount) / (leftTotal + rightTotal);
}
export function nodeToInfo(node: SyntaxNode): any {
  return {
    "start_row": node.startPosition.row,
    "start_col": node.startPosition.column,
    "end_row": node.endPosition.row,
    "end_col": node.endPosition.column,
  };
}
