import { TokenizedFile } from "../../file/tokenizedFile";
import { SyntaxNode, Tree } from "tree-sitter";
import { Hash } from "../treeIndex";

export function getKey(file1: TokenizedFile, file2: TokenizedFile): string {
  if (file1.id < file2.id) {
    return [file1.id, file2.id].toString();
  } else {
    return [file2.id, file1.id].toString();
  }
}
export function* breadthFirstWalkForest(forest: Tree[]): IterableIterator<SyntaxNode> {
  for (const tree of forest) {
    yield* breadthFirstWalk(tree.rootNode);
  }
}

export function* breadthFirstWalk(rootNode: SyntaxNode): IterableIterator<SyntaxNode> {
  const queue: SyntaxNode[] = [];
  queue.push(rootNode);
  while (queue.length > 0) {
    const node: SyntaxNode = queue.shift() as SyntaxNode;
    yield node;
    for (const child of walkOverChildren(node)) {
      queue.push(child);
    }
  }
}

export function* walkOverChildren(node: SyntaxNode): IterableIterator<SyntaxNode> {
  // const cursor: TreeCursor = node.walk();
  // if (cursor.gotoFirstChild()) {
  //   yield cursor.currentNode;
  //   while (cursor.gotoNextSibling()) {
  //     if(!cursor.currentNode.isNamed) {
  //       continue;
  //     }
  //     yield cursor.currentNode;
  //   }
  // }
  for (const child of node.namedChildren) {
  // console.log(node.type, child.type);
    yield child;
  }
}

export function groupNodes(
  forest: Tree[],
  hashToNodeList: Map<Hash, Array<SyntaxNode>>,
  nodeToHash: Map<SyntaxNode, Hash>
): [SyntaxNode[][], Set<Hash>] {
  const acceptedSet: Set<SyntaxNode> = new Set();
  // matches
  const grouped: SyntaxNode[][] = [];
  const hashes: Set<Hash> = new Set();
  // Has to be breadth first so that parents are always first
  for (const node of breadthFirstWalkForest(forest)) {
    if (acceptedSet.has(node)) {
      continue;
    }

    const matchedNodes: SyntaxNode[] = hashToNodeList.get(
      nodeToHash.get(node) as Hash
    ) as SyntaxNode[];
    hashes.add(nodeToHash.get(node) as Hash);

    if (matchedNodes.length > 1) {
      grouped.push(matchedNodes);
      for (const matchedNode of matchedNodes) {
        for (const child of breadthFirstWalk(matchedNode)) {
          acceptedSet.add(child);
        }
      }
    }
  }
  return [grouped, hashes];
}
