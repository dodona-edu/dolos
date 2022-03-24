import { Hash } from "../treeIndex";
import { SyntaxNode, Tree } from "tree-sitter";
import { breadthFirstWalk, walkOverChildren } from "./treeUtils";

export class TreeIsomorphism {

  // maps a stringified list to the number associated with it
  private readonly listNumber: Map<string, Hash> = new Map();
  // TODO could possibly be removed?
  // maps a root of a (sub)tree to it's size
  public readonly nodeToTreeSize: Map<SyntaxNode, number> = new Map();
  // maps a syntax node to it's amount of children that are not yet processed by the algorithm
  private readonly children: Map<SyntaxNode, number> = new Map();
  // a number, monotonically increases during the execution of the algorithm. If two roots of two sub-trees have the
  // same number assigned to them, then they are isomorphic
  public count: Hash = 0;
  // maps a node to it's number
  private readonly nodeToHash: Map<SyntaxNode, Hash> = new Map();

  // private isProcessed = new Map<SyntaxNode, boolean>();
  public constructor(forest: Tree[]) {
    this.subTreeIsomorphism(forest);
  }


  private subTreeIsomorphism(forest: Tree[]): void {
    const queue: SyntaxNode[] = [];
    for (const tree of forest) {
      for (const syntaxNode of breadthFirstWalk(tree.rootNode)) {
        this.nodeToTreeSize.set(syntaxNode, 1);
        this.children.set(syntaxNode, syntaxNode.namedChildCount);
        // // TODO delete
        // this.isProcessed.set(syntaxNode, false);
        if (syntaxNode.namedChildCount === 0) {
          queue.push(syntaxNode);
        }
      }

    }

    this.count = 0;
    while (queue.length > 0) {
      const node: SyntaxNode = queue.shift() as SyntaxNode;
      // // TODO delete
      // this.isProcessed.set(node, true);
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

    // // TODO delete
    // const testSet = new Set();
    // const testList = [];
    // for(const tree of [forest[0]]){
    //   let node = tree.rootNode;
    //   while(this.nodeToHash.get(node) === undefined) {
    //     const temp = node.namedChildren.map(child => [
    //       child.type,
    //       this.nodeToHash.get(child),
    //       this.children.get(child),
    //       this.isProcessed.get(child),
    //       child.startIndex,
    //       child.endIndex,
    //       child.parent == node
    //     ]);
    //     console.log(temp);
    //
    //     if(testSet.has(node)) {
    //       console.log("loop detected?");
    //       break;
    //     }
    //     testSet.add(node);
    //     testList.push(node);
    //
    //     let found = false;
    //     for(const child of walkOverChildren(node)) {
    //       if(child.startIndex == 2481) {
    //         console.log("here");
    //       }
    //       if(this.nodeToHash.get(child) == undefined) {
    //         node = child;
    //         found = true;
    //         break;
    //       }
    //     }
    //     if(!found) {
    //       break;
    //     }
    //   }
    //
    // }
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
}
