import { TokenizedFile } from "../file/tokenizedFile";
import { Index } from "./index";
import { DefaultMap } from "../util/defaultMap";
import { HashFilter } from "../hashing/hashFilter";
import { Region } from "../util/region";
import { countByKey, intersect, mapValues, sumByKey } from "../util/utils";
import { Occurrence } from "./report";

// The AST needs to be annotated with the matching information gotten from @link{Index} to produce information on
// which nodes in the AST are matched.
type AstWithMatches = {
  tokenToGroup: Map<number, number>,
  groups: Occurrence[][]
};

// This is the information we will extract from the annotated AST. It consists of a node in the tree, of which it and
// its children match reasonably well with parts of another file. It holds the information of matching reasonably well
// for all other files.
export type NodeStats = {
    ownNodes: number[],
    matchedNodeAmount: Map<number, number>,
    childrenMatch: Map<number, number>,
    childrenTotal: number,
    depth: number,
    occurrences: Set<number>
}

// If two semantic groups are alike in two files, we can pair them
export type PairedSemanticGroups<T> = {
  rightMatch: T;
  leftMatch: T;
}

// In some cases, a contiguous semantic group in one file cannot be linked to a contiguous semantic group in another
// file. In that case, the group only exists in either the left file or the right file.
export type LeftOnlySemanticGroup<T> = {
  leftMatch: T;
  occurrences: number[];
}

export type RightOnlySemanticGroup<T> = {
  rightMatch: T;
  occurrences: number[];

}

export type UnpairedSemanticGroups<T> = LeftOnlySemanticGroup<T> | RightOnlySemanticGroup<T>;

export type Pairable = {
  occurrences: Set<number>;
}

// Additional helper type for the return value of 'recurse'.
type ReturnData = {
  nodeStats: NodeStats;
  currentI: number;
  lastMatchedLevels: Map<number, NodeStats[]>;
}

export class SemanticAnalyzer {

  constructor(private index: Index) {}

  public async semanticAnalysis(
    tokenizedFiles: TokenizedFile[],
    hashFilter?: HashFilter
  ): Promise<[Occurrence[][], Map<number, Map<number, NodeStats[]>>]> {
    const results = new Map();
    const astMap = await this.astWithMatches(tokenizedFiles, hashFilter);
    for(const tokenizedFile of tokenizedFiles) {
      results.set(tokenizedFile.id, this.semanticAnalysisOneFile(tokenizedFile, astMap.get(tokenizedFile)));
    }


    return [astMap.get(tokenizedFiles[0]).groups, results];
  }

  private semanticAnalysisOneFile(
    tokenizedFile: TokenizedFile,
    matchedAST: AstWithMatches,
  ): Map<number, NodeStats[]> {
    const last = this.recurse(tokenizedFile.id, 0, tokenizedFile.ast, matchedAST, 0);
    const matchedLevels = last.lastMatchedLevels;
    if(!matchedLevels)
      return new Map();

    const filterNodeList = (list: NodeStats[]): NodeStats[] =>
      list.filter(p => p.ownNodes.length + p.childrenTotal > 15);

    return mapValues(filterNodeList, matchedLevels);
  }

  private recurse(fileId: number, i: number, ast: string[], matchedAST: AstWithMatches, depth: number): ReturnData {
    const ownNodes: number[] = [];
    const currentChildren: ReturnData[] = [];

    /*
    The AST is stored in a list of strings-format, where each child starts with '(' and closes with ')'
    Everything inbetween these braces is part of this node in the tree.
    We will gather all parts of this node in a list, and if we encounter a child (signified by '(') we will
    recursively descend in the tree.

    Further analysis of this node will happen after we have parsed this AST (the while loop stops)
    */
    let index = i;
    let currentNode = ast[index];

    // This while loop stops when this entire node has been parsed, including all children
    // Or on an edge case that can sometimes happen at the end of the AST.
    while(currentNode != ")" && index < ast.length) {
      /*
      Case analysis of the node:
      1. this is text, we add it to the 'ownNodes' array, which stores all strings part of this node in the tree
      2. it is the token '(', which signifies that we should recursively parse & analyze a child
      3. it is ')', which means this entire node and all it's children have been parsed & analyzed and we are done
         parsing this node, we can proceed to using the parsed info to analyze the node
       */
      if(currentNode !== "(" && currentNode !== ")") {
        // Handle node
        ownNodes.push(index);

      } else if (currentNode == "(") {
        // Parse & analyze child node
        const r = (this.recurse(fileId,index+1, ast, matchedAST, depth+1));
        index = r.currentI;
        currentChildren.push(r);
      }

      index += 1;
      currentNode = ast[index];
    }

    const occurrenceGroups = matchedAST.groups;
    // Can this node be found in other files?
    // Is a dict which keeps this value for every file, in the form fileId => occurs in this file or not.
    // Because our node can consist of different strings, this is a number instead of a boolean.
    const ownMatchesCountByFile = countByKey(
      ownNodes
        .map(n => matchedAST.tokenToGroup.get(n))
        .filter((n): n is number => n !== undefined)
        .map(n => occurrenceGroups[n])
        .flat()
        .map(n => n.file.id)
        .filter(n => n !== fileId)
    );

    // Can our children be found in other files?
    // Simply counts the returned values from the analysis performed by our children
    //  Is a dict which keeps this value for every file, in the form fileId => occurs in this file or not.
    const totalChildrenMatchByFile = currentChildren
      .map(c => sumByKey(c.nodeStats.childrenMatch, c.nodeStats.matchedNodeAmount))
      .reduce(sumByKey, new Map());

    const totalChildrenCount = currentChildren.reduce(
      (a, b)  => a + b.nodeStats.childrenTotal + b.nodeStats.ownNodes.length, 0);

    const childrenOccurrences = currentChildren.map(c => c.nodeStats.occurrences);
    const currentOccurrences = ownNodes
      .map(n => matchedAST.tokenToGroup.get(n))
      .filter((n): n is number => n !== undefined);

    // This set contains all the occurrences (hashes) that are used as 'proof' of matching
    // Useful to later identify common groups

    const occurrences = new Set(Array.from(childrenOccurrences.map(v => Array.from(v))).concat(currentOccurrences).flat());

    // This is the preliminary result of our analysis, grouping all relevant information together.
    // We will use this information to decide (per file) whether this node is part of a larger group or not.
    const nodeStats = {
      ownNodes,
      matchedNodeAmount: ownMatchesCountByFile,
      childrenTotal: totalChildrenCount,
      childrenMatch: totalChildrenMatchByFile,
      depth,
      occurrences
    };


    // These are all the files where this node could be part of a group.
    // The files which are not candidate files have no matches in this node or the children,
    // so don't have to be analyzed
    const candidateFiles = Array.from(ownMatchesCountByFile.keys())
      .concat(currentChildren.map(c => Array.from(c.lastMatchedLevels.keys())).flat());

    const lastMatchedLevels = new Map();

    /*
     * For each of the candidate files, we will now try to reason out whether we want to group this node and
     * the children in a matched group or not. This is the main output of the algorithm.
     */
    for(const candidateFile of candidateFiles) {

      // Decides whether the group should be made or not.
      const thisMatches = this.doesLevelMatch(
        ownNodes,
        ownMatchesCountByFile.get(candidateFile) || 0,
        totalChildrenMatchByFile.get(candidateFile) || 0,
        totalChildrenCount);

      /*
        There are two options:
        1. We match the node: this means that we consider this node and all its children as a semantic group
           which is common across the original file and the file in this for loop. The output of the algorithm will be
           this group.
        2. We don't match the node: this means that we don't consider this node and its children as a group. If the
           children themselves have formed groups, we will return these as the result of this subtree.
       */

      let returnedGroups: NodeStats[];
      if(thisMatches) {
        returnedGroups = [nodeStats];
      } else {
        returnedGroups = currentChildren.reduce<NodeStats[]>(
          (prev, ch) => prev.concat(ch.lastMatchedLevels.get(candidateFile) || []),
          []
        );
      }

      lastMatchedLevels.set(candidateFile, returnedGroups);
    }

    // The 'nodeStats' POJO is the information which is exposed as the results of this algorithm.
    // The other data in this return field is required for correct execution of the algorithm, but is internal data.
    return {
      currentI: index,
      nodeStats,
      lastMatchedLevels
    };

  }


  // How many of your children must match before this node will be matched?
  // For this value, it's not required that your own token excluding children must match
  readonly PERCENTAGE_CHILDREN_MATCH_EXCLUSIVE = 0.9;

  // In addition to your own tokens matching, how many of your children's tokens must match?
  readonly PERCENTAGE_CHILDREN_MATCH_INCLUSIVE = 0.8;

  // How many strings of your AST node must match before you consider yourself matched?
  // (note: generally there is only one string per AST node, which means this value is in effect 100% most of the time)
  readonly PERCENTAGE_OWNNODE_MATCH = 0.8;


  //
  /*
  This function encodes the reasoning whether a node matches or not.
   */
  private doesLevelMatch(ownNodes: number[], ownMatch: number, childrenMatch: number, childrenTotal: number): boolean {
    if(childrenTotal == 0) {
      return ownMatch === ownNodes.length;
    }

    return childrenMatch > childrenTotal * this.PERCENTAGE_CHILDREN_MATCH_EXCLUSIVE ||
        (childrenMatch > childrenTotal * this.PERCENTAGE_CHILDREN_MATCH_INCLUSIVE &&
            ownMatch > ownNodes.length  * this.PERCENTAGE_OWNNODE_MATCH);
  }


  private async astWithMatches(
    tokenizedFiles: TokenizedFile[],
    hashFilter?: HashFilter
  ): Promise<DefaultMap<TokenizedFile, AstWithMatches>> {

    const occurrenceMap = await this.index.createMatches(tokenizedFiles, hashFilter);
    const groupedOccurrences = Array.from(occurrenceMap.values());
    const getDefault = (): AstWithMatches => ({ tokenToGroup: new Map(), groups: groupedOccurrences });
    const astMap = new DefaultMap<TokenizedFile, AstWithMatches>(getDefault);


    for(let i = 0; i < groupedOccurrences.length; i++) {
      const occurrenceGroup = groupedOccurrences[i];
      if(occurrenceGroup.length > 1)
        for (const occurence of occurrenceGroup) {
          const matchMap = astMap.get(occurence.file);
          for (let j = occurence.side.start; j <= occurence.side.stop;   j++) {
            matchMap.tokenToGroup.set(j, i);
          }
        }
    }
    return astMap;
  }

  public static getFullRange(file: TokenizedFile, match: { ownNodes: number[] }): Region {
    const ast = file.ast;
    const mapping = file.mapping;

    let currentRegion = mapping[match.ownNodes[0]] ||
        new Region(0,0,file.lines.length,file.lines[file.lines.length-1].length);


    for(const ownNode of match.ownNodes) {
      let i = ownNode;
      let done = false;
      let counter = 1;


      while(i < ast.length && !done) {
        if(ast[i] == ")") {
          counter -= 1;
        } else if (ast[i] == "(") {
          counter += 1;
        } else {
          currentRegion = Region.merge(currentRegion, mapping[i]);
        }

        if(counter == 0 && i != ownNode)
          done = true;
        i += 1;
      }

    }

    return currentRegion;
  }


  // When comparing two semantic groups, we look at how many occurrences that were used to build this match
  // are common between these two semantic groups. If there are many, it's quite likely these groups are plagiarized
  // from each other.
  // This variable denotes how many should be common to consider these groups linked.
  static readonly  PAIRING_TOLERANCE = 0.7;


  public static pairMatches<T extends Pairable>(
    fileLeft: TokenizedFile,
    fileRight: TokenizedFile,
    leftMatches: T[],
    rightMatches: T[],
    occurrenceGroups: number[][]
  ): [PairedSemanticGroups<T>[], UnpairedSemanticGroups<T>[]] {
    const pairs: PairedSemanticGroups<T>[] = [];
    const notPaired: UnpairedSemanticGroups<T>[] = [];

    const pairedRightMatches = new Set();

    // We look for a pair to every group of the left files
    for(const leftMatch of leftMatches) {
      let assigned = false;

      for(const rightMatch of rightMatches) {
        const is = intersect(leftMatch.occurrences, rightMatch.occurrences);
        if(is.size > leftMatch.occurrences.size * this.PAIRING_TOLERANCE
          || is.size > rightMatch.occurrences.size * this.PAIRING_TOLERANCE) {
          pairs.push({ leftMatch, rightMatch }); // if a corresponding right match is found, we add it to the array
          assigned = true;
          pairedRightMatches.add(rightMatch);
        }
      }

      // If we can't find any right group that corresponds to a left group, we push the rest of the assignments as
      // unpaired groups
      if(!assigned) {
        const occs = Array.from(leftMatch.occurrences)
          .map(n => occurrenceGroups[n])
          .flat()
          .filter(o => o === fileRight.id);
        notPaired.push({ leftMatch, occurrences: occs });
      }
    }


    // Any right groups that didn't find a left pair in the previous step get pushed as unpaired right groups.
    for(const rightMatch of rightMatches) {
      if(!pairedRightMatches.has(rightMatch)) {
        const occs = Array.from(rightMatch.occurrences)
          .map(n => occurrenceGroups[n])
          .flat()
          .filter(o => o === fileLeft.id);
        notPaired.push({ rightMatch, occurrences: occs });
      }
    }

    // We return both the pairs and the unpaired groups we found
    return [pairs, notPaired];
  }

}
