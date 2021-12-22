import { IndexInterface } from "./indexInterface";
import { SimpleReport } from "./simpleReport";
import { File } from "../file/file";
import { CustomOptions, Options } from "../util/options";
import { default as Parser, SyntaxNode, Tree, TreeCursor } from "tree-sitter";
import { TokenizedFile } from "../file/tokenizedFile";
import { ScoredPairs } from "./reportInterface";
import { SimplePair } from "./simplePair";
import { buildSimpleFragment } from "./simpleFragmentBuilder";
import { SharedFingerprint } from "./sharedFingerprint";

type Hash = number;

export class TreeIndex implements IndexInterface {
  private parser?: Parser;
  // maps a stringified list to the number associated with it
  private readonly listNumber: Map<string, Hash> = new Map();
  // TODO could possibly be removed?
  // maps a root of a (sub)tree to it's size
  private readonly size: Map<SyntaxNode, number> = new Map();
  // maps a syntax node to it's amount of children that are not yet processed by the algorithm
  private readonly children: Map<SyntaxNode, number> = new Map();
  // a number, monotonically increases during the execution of the algorithm. If two roots of two sub-trees have the
  // same number assigned to them, then they are isomorphic
  private count: Hash = 0;
  // maps a node to it's number
  private readonly nodeNumber: Map<SyntaxNode, Hash> = new Map();

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

    const nodeMappedToFile: Map<SyntaxNode, TokenizedFile> = new Map();
    const forest: Tree[] = [];

    if(!this.parser){
      this.parser = this.createParser();
    }

    for (const file of files) {
      const tree = this.parser.parse(file.content);
      const tokenizedFile = new TokenizedFile(file, [], []);
      forest.push(tree);

      for (const node of TreeIndex.breadthFirstWalk(tree.rootNode)) {

        nodeMappedToFile.set(node, tokenizedFile);
      }
    }

    this.subTreeIsomorphism(forest);

    // console.log(this.listNumber);

    // const grouped = this.listNumber.ent
    const numberToNodeList: Map<number, SyntaxNode[]> = new Map();

    for (const node of TreeIndex.breadthFirstWalkForest(forest)) {
      // // leave matches are not useful information
      // if(node.childCount == 0) {
      //   continue;
      // }
      const integer: number = this.nodeNumber.get(node) as number;
      const matchedNodes = numberToNodeList.get(integer);
      if (matchedNodes !== undefined) {
        matchedNodes.push(node);
      } else {
        numberToNodeList.set(integer, [node]);
      }
    }

    // nodes that have either already been looked at or it's a root of a subtree to which this node belongs has been
    // accepted
    const acceptedSet: Set<SyntaxNode> = new Set();
    // matches
    const grouped: SyntaxNode[][] = [];
    const hashes: Set<Hash> = new Set();
    // Has to be breadth first so that parents are always first
    for (const node of TreeIndex.breadthFirstWalkForest(forest)) {
      if (acceptedSet.has(node)) {
        continue;
      }

      const matchedNodes: SyntaxNode[] = numberToNodeList.get(
          this.nodeNumber.get(node) as Hash
      ) as SyntaxNode[];
      hashes.add(this.nodeNumber.get(node) as Hash);

      if (matchedNodes.length > 1) {
        grouped.push(matchedNodes);
        for (const matchedNode of matchedNodes) {
          for (const child of TreeIndex.breadthFirstWalk(matchedNode)) {
            acceptedSet.add(child);
          }
        }
      }
    }

    const filteredGroup = grouped.filter(group =>
      group.some(node => node.endPosition.row - node.startPosition.row > 0),
    );

    const hashToFingerprint: Map<Hash, SharedFingerprint> = new Map();
    for(const hash of hashes.values()) {
      const fingerPrint = new SharedFingerprint(hash, null);
      hashToFingerprint.set(hash, fingerPrint);
    }

    const pairs: Array<ScoredPairs> = [];
    const pairDict: Map<string, SimplePair> = new Map();
    for (const group of filteredGroup) {
      const hash = this.nodeNumber.get(group[0]) as Hash;
      const fingerprint = hashToFingerprint.get(hash) as SharedFingerprint;
      // console.log("new group");
      for(let i = 0; i < group.length; i += 1) {
        const leftNode = group[i];
        const leftFile = nodeMappedToFile.get(leftNode) as TokenizedFile;
        for(let j = i + 1; j < group.length; j += 1) {
          const rightNode = group[j];
          const rightFile = nodeMappedToFile.get(rightNode) as TokenizedFile;
          const key = this.getKey(leftFile, rightFile);
          let pair;
          if(pairDict.has(key)) {
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

    const tokenizedFiles = [...new Set(nodeMappedToFile.values())];


    return new SimpleReport(pairs, new Options(), tokenizedFiles);
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

  private getKey(file1: TokenizedFile, file2: TokenizedFile): string {
    if(file1.id < file2.id) {
      return [file1.id, file2.id].toString();
    } else {
      return [file2.id, file1.id].toString();
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
      yield* TreeIndex.breadthFirstWalk(tree.rootNode);
    }
  }

  private static* breadthFirstWalk(rootNode: SyntaxNode): IterableIterator<SyntaxNode> {
    const queue: SyntaxNode[] = [];
    queue.push(rootNode);
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
