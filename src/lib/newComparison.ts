import fs from "fs";
import { default as Parser, SyntaxNode, Tree, TreeCursor } from "tree-sitter";
import { CodeTokenizer } from "./codeTokenizer";
import { Clustered } from "./utils";
interface ExtendedSyntaxNode extends SyntaxNode {
  file: string;
}
export class NewComparison {
  public readonly language: string;
  private readonly parser: Parser;

  private readonly size: Map<SyntaxNode, number> = new Map();
  private readonly children: Map<SyntaxNode, number> = new Map();
  private count: number = 0;

  private readonly D: Map<string, number> = new Map();
  private readonly integer: Map<SyntaxNode, number> = new Map();

  constructor(language: string) {
    if (!CodeTokenizer.isSupportedLanguage(language)) {
      throw new Error(`Language '${language}' is not supported`);
    }

    this.language = language;
    this.parser = new Parser();
    // tslint:disable-next-line: no-var-requires
    const languageModule = require("tree-sitter-" + language);
    this.parser.setLanguage(languageModule);
  }

  public compareFiles(files: string[]): any {
    const forest: Tree[] = files
      .map(file => fs.readFileSync(file, "utf8"))
      .map(fileContents => this.parser.parse(fileContents));

    for (const file of files) {
      const contents: string = fs.readFileSync(file, "utf8");
      const tree = this.parser.parse(contents);
      const queue: SyntaxNode[] = [];
      queue.push(tree.rootNode);
      while (queue.length > 0) {
        const node: ExtendedSyntaxNode = queue.shift() as ExtendedSyntaxNode;
        node.file = file;
        for (const child of this.walkOverChildren(node)) {
          queue.push(child);
        }
      }
    }

    this.isomorphism(forest);

    const numberToNodeList: Map<number, SyntaxNode[]> = new Map();

    for (const node of this.breadthFirstWalkForest(forest)) {
      const number: number = this.integer.get(node) as number;
      const matchedNodes = numberToNodeList.get(number);
      if (matchedNodes !== undefined) {
        matchedNodes.push(node);
      } else {
        numberToNodeList.set(number, [node]);
      }
    }

    const acceptedSet: Set<SyntaxNode> = new Set();
    const grouped: Clustered<SyntaxNode> = [];
    // Has to be breadth first so that parents are always first
    for (const node of this.breadthFirstWalkForest(forest)) {
      if (
        acceptedSet.has(node) ||
        node.childCount === 0 ||
        (!node.parent !== null && acceptedSet.has(node.parent as SyntaxNode))
      ) {
        continue;
      }
      const matchedNodes: SyntaxNode[] = numberToNodeList.get(this.integer.get(
        node,
      ) as number) as SyntaxNode[];
      if (matchedNodes.length > 1) {
        grouped.push(matchedNodes);
        matchedNodes.forEach(matchedNode => acceptedSet.add(matchedNode));
      }
    }
    return grouped;
  }

  private isomorphism(forest: Tree[]) {
    const queue: SyntaxNode[] = [];
    for (const syntaxNode of this.breadthFirstWalkForest(forest)) {
      this.size.set(syntaxNode, 1);
      this.children.set(syntaxNode, syntaxNode.childCount);
      if (syntaxNode.childCount === 0) {
        queue.push(syntaxNode);
      }
    }

    this.count = 0;
    while (queue.length > 0) {
      const node: SyntaxNode = queue.shift() as SyntaxNode;
      this.assignIntegerToSubreeRootedAtV(node);
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

  private assignIntegerToSubreeRootedAtV(v: SyntaxNode) {
    const L: number[] = [];
    for (const child of this.walkOverChildren(v)) {
      L.push(this.integer.get(child) as number);
    }
    L.sort((e1, e2) => e1 - e2);
    // @ts-ignore
    L.unshift(v.type);
    if (this.D.has(L.toString())) {
      this.integer.set(v, this.D.get(L.toString()) as number);
    } else {
      this.count += 1;
      this.D.set(L.toString(), this.count);
      this.integer.set(v, this.count);
    }
  }
  private *walkOverChildren(node: SyntaxNode | ExtendedSyntaxNode): IterableIterator<SyntaxNode> {
    const cursor: TreeCursor = node.walk();
    if (cursor.gotoFirstChild()) {
      do {
        yield cursor.currentNode;
      } while (cursor.gotoNextSibling());
    }
  }

  private *breadthFirstWalkForest(forest: Tree[]): IterableIterator<SyntaxNode> {
    for (const tree of forest) {
      yield* this.breadthFirstWalk(tree);
    }
  }

  private *breadthFirstWalk(tree: Tree): IterableIterator<SyntaxNode> {
    const queue: SyntaxNode[] = [];
    queue.push(tree.rootNode);
    while (queue.length > 0) {
      const node: SyntaxNode = queue.shift() as SyntaxNode;
      yield node;
      for (const child of this.walkOverChildren(node)) {
        queue.push(child);
      }
    }
  }
}
