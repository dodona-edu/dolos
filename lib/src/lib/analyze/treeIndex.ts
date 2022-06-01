import { IndexInterface } from "./indexInterface";
import { SimpleReport } from "./simpleReport";
import { File } from "../file/file";
import { CustomOptions, Options } from "../util/options";
import { default as Parser, SyntaxNode, Tree } from "tree-sitter";
import { TokenizedFile } from "../file/tokenizedFile";
import { makeScoredPairs, mapHashToSharedFingerprint, mapHashToNodeList } from "./treeMatching/TreeReportUtils";
import { TreeIsomorphism } from "./treeMatching/treeIsomorphism";
import { breadthFirstWalk, groupNodes, walkOverChildren } from "./treeMatching/treeUtils";
import * as console from "console";
// import * as path from "path";
// import * as process from "process";
import * as child_process from "child_process";
import { promisify } from "util";

export type Hash = number;
type Vector = Array<number>;

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
    //TODO
    const groupedExtended = await this.extention1(
      nodeToHash,
      grouped,
      nodeMappedToFile,
      treeIsomorphism.nodeToTreeSize
    );

    // TODO more intelligent merging
    const groupMerged = [...grouped, ...groupedExtended];

    const filteredGroup = this.filterGroups(groupMerged, this.options.minLines, this.options.minDepth);


    // adapt data to current output format
    const hashToFingerprint = mapHashToSharedFingerprint(hashes);


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


  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  private async extention1(
    nodeToHash: Map<SyntaxNode, Hash>,
    grouped: SyntaxNode[][],
    _nodeMappedToFile: Map<SyntaxNode, TokenizedFile>,
    nodeToTreeSize: Map<SyntaxNode, number>
  ): Promise<Array<SyntaxNode[]>> {

    const NEAR_MISS_COUNT_THRESHOLD = 2; // TODO
    const NEAR_MISS_CHILD_THRESHOLD = 2;
    // const SIMILARITY_THRESHOLD = 0.5;
    const MINIMUM_LINES = 0;
    const MAX_CLUSTER_SIZE = 20;

    const matchedChildCount: Map<SyntaxNode, number> = new Map();

    // loop over nodes which have a match somewhere in the tree and don't have a parent which is matched
    for(const group of grouped) {
      for(const node of group) {
        //
        if(node.parent == null || node.parent.endPosition.row - node.parent.startPosition.row < MINIMUM_LINES) {
          continue;
        }

        if (matchedChildCount.has(node.parent)) {
          const count = matchedChildCount.get(node.parent) as number;
          matchedChildCount.set(node.parent, count + 1);
        } else {
          matchedChildCount.set(node.parent, 1);
        }
      }
    }


    const potentialNearMisses = [];

    const hashSet: Set<Hash> = new Set();
    for(const [node, count] of matchedChildCount.entries()) {
      if(count > NEAR_MISS_COUNT_THRESHOLD && node.namedChildCount > NEAR_MISS_CHILD_THRESHOLD) {
        potentialNearMisses.push(node);
        for(const child of walkOverChildren(node)) {
          hashSet.add(nodeToHash.get(child) as Hash);
        }
      }
    }

    const hashCount = hashSet.size;
    const hashToIndex: Map<Hash, number> = new Map();

    {
      let i = 0;
      for (const hash of hashSet.values()) {
        hashToIndex.set(hash, i);
        i += 1;
      }
    }
    const weights = Array(hashCount).fill(0);
    const toVec = (node: SyntaxNode): Vector => {
      // no new keyword is needed https://262.ecma-international.org/6.0/#sec-array-constructor
      const list = Array(hashCount).fill(0);
      for(const child of walkOverChildren(node)) {
        const index = hashToIndex.get(nodeToHash.get(child) as Hash) as number;
        const weight = nodeToTreeSize.get(child);
        list[index] += weight;
        weights[index] = weight;
      }
      return list;
    };

    const vecToNode: Map<Vector, Array<SyntaxNode>> = new Map();
    for(let nodeIndex = 0; nodeIndex < potentialNearMisses.length; nodeIndex += 1) {
      const node = potentialNearMisses[nodeIndex];
      const vec = toVec(node);

      if (vecToNode.has(vec)) {
        (vecToNode.get(vec) as Array<SyntaxNode>).push(node);
      } else {
        vecToNode.set(vec, [node]);
      }
    }

    const vecList: Array<Vector> = [];
    const nodesList: Array<Array<SyntaxNode>> = [];

    for(const [vec, nodes] of vecToNode.entries()) {
      vecList.push(vec);
      nodesList.push(nodes);
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require("fs");
    const file = "./temp.json";
    fs.writeFileSync(file, JSON.stringify(vecList), "utf-8");
    console.log("positions written to: " + file);

    const pexec = promisify(child_process.exec);
    await pexec(
      "cat ./temp.json | /home/steam/mount/secondary/UGent/2021-2022/thesis/clustering_script/PCA.py labels1.json"
    );


    const labels = JSON.parse(fs.readFileSync("./labels1.json").toString("utf-8"));
    const clusterToSize = new Map();
    for (const label of labels) {
      if(!clusterToSize.has(label)) {
        clusterToSize.set(label, 0);
      }
      clusterToSize.set(label, clusterToSize.get(label)+1);
    }

    const labelToGroup: Map<number, SyntaxNode[]> = new Map();
    for(let i = 0; i < labels.length; i += 1) {
      const label = labels[i];
      if(label === -1 || clusterToSize.get(label) > MAX_CLUSTER_SIZE){
        continue;
      }

      let group: SyntaxNode[];
      if(labelToGroup.has(label)) {
        group = labelToGroup.get(label) as SyntaxNode[];
      } else {
        group = [];
        labelToGroup.set(label, group);
      }
      const nodes = nodesList[i];
      for(const node of nodes) {
        group.push(node);
      }
    }

    const groupsList = [];
    for(const group of labelToGroup.values()) {
      groupsList.push(group);
      // console.log("=============================================================");

      // const files = group.map(node => (_nodeMappedToFile.get(node) as TokenizedFile).path);
      // const b1 = files.some(path => path.includes("main_A") || path.includes("function_rename"));
      // const b2 = group
      //   .some(node => _nodeMappedToFile.get(node)?.path.includes("function_rename") &&
      //     node.endPosition.row > 260);
      //
      // if(!(b1 && b2)) {
      //   continue;
      // }
      // for (const node of group) {
      //   const nodeFile = _nodeMappedToFile.get(node) as TokenizedFile;
      //   if( !(nodeFile.path.includes("063") || nodeFile.path.includes("048") || nodeFile.path.includes("051"))) {
      //     continue;
      //   }
      //
      //   let str = `[ ${path.basename(nodeFile.path)} ] `;
      //   str += `{from: [${node.startPosition.row + 1}, ${node.startPosition.column}]`;
      //   str += `, to: [${node.endPosition.row + 1}, ${node.endPosition.column}]}`;
      //
      //   const childrenSet = new Set();
      //   for(const child of walkOverChildren(node)) {
      //     if(nodeToHash.get(child) === undefined) {
      //       console.log("welp");
      //       process.exit(100000);
      //     }
      //     childrenSet.add({
      //       "n": nodeToHash.get(child),
      //       "w": nodeToTreeSize.get(child),
      //       "t": child.type,
      //       "text": child.text
      //     });
      //   }
      //   if(childrenSet.size < 2) {
      //     continue;
      //   }
      //   console.log("+++++++++++++++++++++++++++++++++++++++" + str, childrenSet);
      //
      //   for(let i = node.startPosition.row; i <= node.endPosition.row; i += 1) {
      //     console.log(nodeFile.lines[i]);
      //   }
      // }
      // console.log("");
    }

    return groupsList;
    // console.log(labels);

    // const optics = new clustering.OPTICS();
    // const clusters = optics.run
    //
    // const tree = createKDTree(vecList);
    // const similarities = [];
    // for(let vecIndex = 0; vecIndex < vecList.length; vecIndex += 1) {
    //   const vec = vecList[vecIndex];
    //   const nodes = nodesList[vecIndex] as SyntaxNode[];
    // const root = nodes[0];
    // nodes that have the same position are in the same equivalence class
    // for(const node of nodes) {
    //   if(nodeToGroupRoot.has(node)) {
    //     const newRoot = TreeIndex.getRoot(node, nodeToGroupRoot) as SyntaxNode;
    //     nodeToGroupRoot.set(node, newRoot);
    //     nodeToGroupRoot.set(root, newRoot);
    //   } else {
    //     nodeToGroupRoot.set(node, root);
    //   }
    // }

    // for(const node of nodes) {
    //   const nodeFile = nodeMappedToFile.get(node) as TokenizedFile;
    //   const k = 4;
    //   const neighbourIndices = tree.knn(vec, k);
    //   for(const neighbourIndex of neighbourIndices) {
    //     const neighbourVec = vecList[neighbourIndex];
    //     const sim = TreeIndex.similarity(vec, neighbourVec);
    //     if(sim === 1) {
    //       continue;
    //     }
    //     similarities.push(sim);
    //     if(TreeIndex.similarity(vec, neighbourVec) > SIMILARITY_THRESHOLD) {
    //       //TODO add to equivalence class
    //       const sim = TreeIndex.similarity(vec, neighbourVec);
    //       const others = nodesList[neighbourIndex];
    //       for(const other of others) {
    //         const otherFile = nodeMappedToFile.get(other) as TokenizedFile;
    //         let nodePath = nodeFile?.path as string;
    //         let otherPath = otherFile?.path as string;
    //         if(nodePath >= otherPath) {
    //           continue;
    //         }
    //         //TODO remove this
    //         nodePath = path.basename(nodePath);
    //         otherPath = path.basename(otherPath);
    //
    //         console.log("========================================================================");
    //         console.log(`${nodePath}\t <==(${sim.toFixed(2)})==>\t ${otherPath}`);
    //         let str = "";
    //         str += `{from: [${node.startPosition.row + 1}, ${node.startPosition.column}]`;
    //         str += `, to: [${node.endPosition.row + 1}, ${node.endPosition.column}]}`;
    //         console.log("+++++++++++++++++++++++++++++++++++++++" + str);
    //
    //         for(let i = node.startPosition.row; i <= node.endPosition.row; i += 1) {
    //           console.log(nodeFile.lines[i]);
    //         }
    //
    //         str = "";
    //         str += `{from: [${other.startPosition.row + 1}, ${other.startPosition.column}]`;
    //         str += `, to: [${other.endPosition.row + 1}, ${other.endPosition.column}]}`;
    //         console.log("+++++++++++++++++++++++++++++++++++++++" + str);
    //
    //         for(let i = other.startPosition.row; i <= other.endPosition.row; i += 1) {
    //           console.log(otherFile.lines[i]);
    //         }
    //
    //         if (nodePath == "dead_code_02.py" && otherPath == "outlining.py") {
    //           const nodeChildren = [];
    //           for(const child of node.namedChildren){
    //             nodeChildren.push([child, TreeIndex.nodeToInfo(child), nodeToHash.get(child)]);
    //           }
    //           const otherChildren = [];
    //           for(const child of other.namedChildren) {
    //             otherChildren.push([child, TreeIndex.nodeToInfo(child), nodeToHash.get(child)]);
    //           }
    //           console.log("");
    //         }
    //       }
    //     }
    //   }
    // }
    // }
    // tree.dispose();

  }

  // private static nodeToInfo(node: SyntaxNode): any {
  //   return {
  //     "start_row": node.startPosition.row,
  //     "start_col": node.startPosition.column,
  //     "end_row": node.endPosition.row,
  //     "end_col": node.endPosition.column,
  //   };
  // }
  //
  // private static similarity(n1: Vector, n2: Vector): number {
  //   let n1Count = 0;
  //   let n2Count = 0;
  //   let overlapCount = 0;
  //   for(let i = 0; i < n1.length; i += 1) {
  //     if(n1[i] != 0) {
  //       n1Count += n1[i];
  //     }
  //     if(n2[i] != 0) {
  //       n2Count += n2[i];
  //     }
  //     if(n1[i] != 0 && n2[i] != 0) {
  //       overlapCount += n1[i] + n2[i];
  //     }
  //   }
  //   return overlapCount / (n1Count + n2Count);
  // }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  private static getRoot(node: SyntaxNode, nodeToGroupRoot: Map<SyntaxNode, SyntaxNode>): SyntaxNode | null {
    if(!nodeToGroupRoot.has(node)) {
      return null;
    }
    let root = nodeToGroupRoot.get(node) as SyntaxNode;
    const stack = [root];
    while(nodeToGroupRoot.has(root)) {
      root = nodeToGroupRoot.get(root) as SyntaxNode;
      stack.push(root);
    }
    for(const value of stack) {
      nodeToGroupRoot.set(value, root);
    }
    return root;
  }

}
