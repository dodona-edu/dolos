import { IndexInterface } from "./indexInterface";
import { SimpleReport } from "./simpleReport";
import { File } from "../file/file";
import { CustomOptions, Options } from "../util/options";
import { default as Parser, SyntaxNode, Tree } from "tree-sitter";
import { TokenizedFile } from "../file/tokenizedFile";
import { makeScoredPairs, mapHashToFingerprint, mapHashToNodeList } from "./treeMatching/TreeReportUtils";
import { TreeIsomorphism } from "./treeMatching/treeIsomorphism";
import { breadthFirstWalk, groupNodes } from "./treeMatching/treeUtils";

export type Hash = number;

export class TreeIndex implements IndexInterface {
  private parser?: Parser;

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

      for (const node of breadthFirstWalk(tree.rootNode)) {

        nodeMappedToFile.set(node, tokenizedFile);
      }
    }


    const treeIsomorphism = new TreeIsomorphism(forest);
    const nodeToHash = treeIsomorphism.getMapping();
    const nodeToTreeSize = treeIsomorphism.getNodeToTreeSize();

    // console.log(this.listNumber);

    // const grouped = this.listNumber.ent
    const hashToNodeList = mapHashToNodeList(forest, nodeToHash);

    // nodes that have either already been looked at or it's a root of a subtree to which this node belongs has been
    // accepted
    const [grouped, hashes] = groupNodes(forest, hashToNodeList, nodeToHash);
    const filteredGroup = this.filterGroups(grouped, this.options.minLines, this.options.minDepth);

    // adapt data to current output format
    const hashToFingerprint = mapHashToFingerprint(hashes);
    const pairs = makeScoredPairs(filteredGroup, hashToFingerprint, nodeMappedToFile, nodeToHash, nodeToTreeSize);
    const tokenizedFiles = [...new Set(nodeMappedToFile.values())];
    return new SimpleReport(pairs, new Options(), tokenizedFiles);
  }


  private getDepth(node: SyntaxNode, depthMap: Map<SyntaxNode, number>): number {
    if(node.childCount == 0) {
      return 0;
    } else if( depthMap.has(node) ) {
      return depthMap.get(node) as number;
    }
    let depth = 0;
    for (const child of node.children) {
      const newDepth = this.getDepth(child, depthMap) + 1;
      if( newDepth > depth) {
        depth = newDepth;
      }
    }
    depthMap.set(node, depth);

    return depth;
  }

  private filterGroups(grouped: SyntaxNode[][], minRows= 1, minDepth = 1): SyntaxNode[][] {
    const map = new Map();
    return grouped
      .map(group => group.filter(node => node.endPosition.row - node.startPosition.row > minRows))
      .map(group => group.filter(node => this.getDepth(node, map) > minDepth ))
      .filter(group => group.length > 1);
  }
}
