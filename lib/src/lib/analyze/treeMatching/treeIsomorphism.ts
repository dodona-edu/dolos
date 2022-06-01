import { Hash } from "../treeIndex";
import { SyntaxNode, Tree } from "tree-sitter";
import { breadthFirstWalkForest, walkOverChildren } from "./treeUtils";

export class TreeIsomorphism {

  // maps a stringified list to the number associated with it
  private readonly listNumber: Map<string, Hash> = new Map();
  // TODO could possibly be removed?
  // maps a root of a (sub)tree to it's size
  private readonly nodeToTreeSize: Map<SyntaxNode, number> = new Map();
  // maps a syntax node to it's amount of children that are not yet processed by the algorithm
  private readonly children: Map<SyntaxNode, number> = new Map();
  // a number, monotonically increases during the execution of the algorithm. If two roots of two sub-trees have the
  // same number assigned to them, then they are isomorphic
  private count: Hash = 0;
  // maps a node to it's number
  private readonly nodeToHash: Map<SyntaxNode, Hash> = new Map();

  public constructor(forest: Tree[]) {
    this.subTreeIsomorphism(forest);
  }


  private subTreeIsomorphism(forest: Tree[]): void {
    const queue: SyntaxNode[] = [];
    for (const syntaxNode of breadthFirstWalkForest(forest)) {
      this.nodeToTreeSize.set(syntaxNode, 1);
      this.children.set(syntaxNode, syntaxNode.namedChildCount);
      if (syntaxNode.namedChildCount === 0) {
        queue.push(syntaxNode);
      }
    }

    this.count = 0;
    while (queue.length > 0) {
      const node: SyntaxNode = queue.shift() as SyntaxNode;
      this.assignNumberToSubTree(node);
      if (node.parent !== null) {
        const parent: SyntaxNode = node.parent as SyntaxNode;
        const sizeParent: number = this.nodeToTreeSize.get(parent) as number;
        this.nodeToTreeSize.set(parent, sizeParent + (this.nodeToTreeSize.get(node) as number));

        this.children.set(parent, (this.children.get(parent) as number) - 1);
        if ((this.children.get(parent) as number) === 0) {
          queue.push(parent);
        }
      }
    }
  }

  /**
   * Assigns a number to the subtree rooted at the given node.
   * @param v: The root of the subtree
   * @private
   */
  private assignNumberToSubTree(v: SyntaxNode): void {
    const nodeNumberList = [];
    for (const child of walkOverChildren(v)) {
      nodeNumberList.push(this.nodeToHash.get(child) as number);
    }
    //TODO use bucket sort
    nodeNumberList.sort((e1, e2) => e1 - e2);

    nodeNumberList.unshift(v.type);
    const listKey = nodeNumberList.toString();
    if (this.listNumber.has(listKey)) {
      this.nodeToHash.set(v, this.listNumber.get(listKey) as number);
    } else {
      this.count += 1;
      this.listNumber.set(listKey, this.count);
      this.nodeToHash.set(v, this.count);
    }
  }

  public getMapping(): Map<SyntaxNode, Hash> {
    return this.nodeToHash;
  }

  public getNodeToTreeSize(): Map<SyntaxNode, number> {
    return this.nodeToTreeSize;
  }
}
