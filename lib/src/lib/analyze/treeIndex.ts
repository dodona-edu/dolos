import { IndexInterface } from "./indexInterface";
import { SimpleReport } from "./simpleReport";
import { File } from "../file/file";
import { CustomOptions } from "../util/options";
import { default as Parser, SyntaxNode, Tree, TreeCursor } from "tree-sitter";

type Count = number;

export class TreeIndex implements IndexInterface {
  private parser?: Parser;
  // maps a stringified list to the number associated with it
  private readonly listNumber: Map<string, Count> = new Map();
  // TODO could possibly be removed?
  // maps a root of a (sub)tree to it's size
  private readonly size: Map<SyntaxNode, number> = new Map();
  // maps a syntax node to it's amount of children that are not yet processed by the algorithm
  private readonly children: Map<SyntaxNode, number> = new Map();
  // a number, monotonically increases during the execution of the algorithm. If two roots of two sub-trees have the
  // same number assigned to them, then they are isomorphic
  private count: Count = 0;
  // maps a node to it's number
  private readonly nodeNumber: Map<SyntaxNode, Count> = new Map();

  constructor(private options: CustomOptions) {}

  private createParser(): Parser {
    try {
      const parser = new Parser();
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const languageModule = require("tree-sitter-" + this.options.language);
      parser.setLanguage(languageModule);
      return parser;
    } catch (error) {
      throw new Error(
        `The module 'tree-sitter-${this.options.language}' could not be found. ` +
          "Try to install it using npm or yarn, but it may not be supported (yet)."
      );
    }
  }

  async compareFiles(files: File[]): Promise<SimpleReport> {
    const nodeMappedToFile: Map<SyntaxNode, string> = new Map();
    const forest: Tree[] = [];

    if(!this.parser){
      this.parser = this.createParser();
    }

    for (const file of files) {
      const tree = this.parser.parse(file.content);
      forest.push(tree);

      for (const node of TreeIndex.breadthFirstWalk(tree)) {
        nodeMappedToFile.set(node, file.path);
      }
    }

    this.subTreeIsomorphism(forest);

    // TODO
    return new SimpleReport([]);
  }

  private subTreeIsomorphism(forest: Tree[]): void {
    const queue: SyntaxNode[] = [];
    for (const syntaxNode of TreeIndex.breadthFirstWalkForest(forest)) {
      this.size.set(syntaxNode, 1);
      this.children.set(syntaxNode, syntaxNode.childCount);
      if (syntaxNode.childCount === 0) {
        queue.push(syntaxNode);
      }
    }

    this.count = 0;
    while (queue.length > 0) {
      const node: SyntaxNode = queue.shift() as SyntaxNode;
      this.assignNumberToSubTree(node);
      if (node.parent !== null) {
        const parent: SyntaxNode = node.parent as SyntaxNode;
        const sizeParent: number = this.size.get(parent) as number;
        this.size.set(parent, sizeParent + (this.size.get(node) as number));

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
    for (const child of TreeIndex.walkOverChildren(v)) {
      nodeNumberList.push(this.nodeNumber.get(child) as number);
    }
    //TODO use bucket sort
    nodeNumberList.sort((e1, e2) => e1 - e2);

    nodeNumberList.unshift(v.type);
    const listKey = nodeNumberList.toString();
    if (this.listNumber.has(listKey)) {
      this.nodeNumber.set(v, this.listNumber.get(listKey) as number);
    } else {
      this.count += 1;
      this.listNumber.set(listKey, this.count);
      this.nodeNumber.set(v, this.count);
    }
  }


  private static* breadthFirstWalkForest(forest: Tree[]): IterableIterator<SyntaxNode> {
    for (const tree of forest) {
      yield* TreeIndex.breadthFirstWalk(tree);
    }
  }

  private static* breadthFirstWalk(tree: Tree): IterableIterator<SyntaxNode> {
    const queue: SyntaxNode[] = [];
    queue.push(tree.rootNode);
    while (queue.length > 0) {
      const node: SyntaxNode = queue.shift() as SyntaxNode;
      yield node;
      for (const child of TreeIndex.walkOverChildren(node)) {
        queue.push(child);
      }
    }
  }

  private static* walkOverChildren(node: SyntaxNode): IterableIterator<SyntaxNode> {
    const cursor: TreeCursor = node.walk();
    if (cursor.gotoFirstChild()) {
      yield cursor.currentNode;
      while (cursor.gotoNextSibling()) {
        yield cursor.currentNode;
      }
    }
  }
}
