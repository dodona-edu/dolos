/**
 * The goal of this class is to take the matching information produced by @link{Index}
 * and perform some semantic analysis on the data. The output should be an array of independent
 * "matches", consisting of
 * 1. a matched region
 * 2. a confidence percentage
 * 3. Optionally (if possible): the semantic level we matched at (e.g. entire program, function, loop, ...)
 */
import { TokenizedFile } from "../file/tokenizedFile";
import { Index } from "./index";
import { DefaultMap } from "../util/defaultMap";
import { HashFilter } from "../hashing/hashFilter";
import { Region } from "../util/region";
import { countByKey, intersect, sumByKey } from "../util/utils";
import { Occurrence } from "./report";

type AstWithMatches = {
  tokenToGroup: Map<number, number>,
  groups: Occurrence[][]
};
// type AnnotatedAst = Map<number, NodeStats>;

export type NodeStats = {
    ownNodes: number[],
    matchedNodeAmount: Map<number, number>,
    childrenMatch: Map<number, number>,
    childrenTotal: number,
    depth: number,
    occurrences: Set<number>
}

export type PairedNodeStats = {
  rightMatch: NodeStats;
  leftMatch: NodeStats;
}

export type LeftOnly = {
  leftMatch: NodeStats;
  occurrences: Occurrence[];
}

export type RightOnly = {
  rightMatch: NodeStats;
  occurrences: Occurrence[];

}

export type UnpairedNodeStats = LeftOnly | RightOnly;

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
  ): Promise<[Occurrence[][], Array<Map<number, NodeStats[]>>]> {
    const results = [];
    const astMap = await this.astWithMatches(tokenizedFiles, hashFilter);
    for(const tokenizedFile of tokenizedFiles) {
      results.push(await this.semanticAnalysisOneFile(tokenizedFile, astMap.get(tokenizedFile)));
    }

    return [astMap.get(tokenizedFiles[0]).groups, results];
  }

  private async semanticAnalysisOneFile(
    tokenizedFile: TokenizedFile,
    matchedAST: AstWithMatches,
  ): Promise<Map<number, NodeStats[]>> {
    const last = this.recurse(tokenizedFile.id, 0, tokenizedFile.ast, matchedAST, 0);
    const matchedLevels = last.lastMatchedLevels;
    if(!matchedLevels)
      return new Map();

    return matchedLevels;
  }

  private recurse(fileId: number, i: number, ast: string[], matchedAST: AstWithMatches, depth: number): ReturnData {
    const ownNodes: number[] = [];
    const currentChildren: ReturnData[] = [];

    // Parsing the AST tree and getting the data from the children
    let index = i;
    let currentNode = ast[index];
    while(currentNode != ")" && index < ast.length) {
      if(currentNode !== "(" && currentNode !== ")") {
        // Handle node
        ownNodes.push(index);

      } else if (currentNode == "(") {
        // Handle start of child
        const r = (this.recurse(fileId,index+1, ast, matchedAST, depth+1));
        index = r.currentI;
        currentChildren.push(r);
      }

      index += 1;
      currentNode = ast[index];
    }

    const occurrenceGroups = matchedAST.groups;
    const ownMatchesCountByFile = countByKey(
      ownNodes
        .map(n => matchedAST.tokenToGroup.get(n))
        .filter((n): n is number => n !== undefined)
        .map(n => occurrenceGroups[n])
        .flat()
        .map(n => n.file.id)
        .filter(n => n !== fileId)
    );

    const totalChildrenMatchByFile = currentChildren
      .map(c => sumByKey(c.nodeStats.childrenMatch, c.nodeStats.matchedNodeAmount))
      .reduce(sumByKey, new Map());

    const totalChildrenCount = currentChildren.reduce(
      (a, b)  => a + b.nodeStats.childrenTotal + b.nodeStats.ownNodes.length, 0);

    const childrenOccurrences = currentChildren.map(c => c.nodeStats.occurrences);
    const currentOccurrences = ownNodes
      .map(n => matchedAST.tokenToGroup.get(n))
      .filter((n): n is number => n !== undefined);

    const occurrences = new Set([...childrenOccurrences.map(v => [...v]), ...currentOccurrences].flat());

    const nodeStats = {
      ownNodes,
      matchedNodeAmount: ownMatchesCountByFile,
      childrenTotal: totalChildrenCount,
      childrenMatch: totalChildrenMatchByFile,
      depth,
      occurrences
    };


    
    const candidateFiles = [
      ...ownMatchesCountByFile.keys(),
      ...currentChildren.map(c => [...c.lastMatchedLevels.keys()]).flat()
    ];

    const lastMatchedLevels = new Map();
    
    for(const candidateFile of candidateFiles) {
      const thisMatches = this.doesLevelMatch(
        ownNodes, 
        ownMatchesCountByFile.get(candidateFile) || 0,
        totalChildrenMatchByFile.get(candidateFile) || 0,
        totalChildrenCount);


      const levelStats = thisMatches ? 
        [nodeStats]
        :
        currentChildren.reduce<NodeStats[]>((prev, ch) =>
          [...prev, ...(ch.lastMatchedLevels.get(candidateFile) || [])], []);


      lastMatchedLevels.set(candidateFile, levelStats);
    }

    return {
      currentI: index,
      nodeStats,
      lastMatchedLevels
    };

  }

  private doesLevelMatch(ownNodes: number[], ownMatch: number, childrenMatch: number, childrenTotal: number): boolean {
    if(childrenTotal == 0) {
      return ownMatch === ownNodes.length;
    }

    return childrenMatch > childrenTotal * 0.9 ||
        (childrenMatch > childrenTotal * 0.8 && ownMatch > ownNodes.length * 0.8);
  }


  private async astWithMatches(
    tokenizedFiles: TokenizedFile[],
    hashFilter?: HashFilter
  ): Promise<DefaultMap<TokenizedFile, AstWithMatches>> {

    const occurrenceMap = await this.index.createMatches(tokenizedFiles, hashFilter);
    const groupedOccurrences = [...occurrenceMap.values()];
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

  public static getFullRange(file: TokenizedFile, match: NodeStats): Region {
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

  public static pairMatches(
    fileLeft: TokenizedFile,
    fileRight: TokenizedFile,
    leftMatches: NodeStats[],
    rightMatches: NodeStats[],
    occurrenceGroups: Occurrence[][]
  ): [PairedNodeStats[], UnpairedNodeStats[]] {
    const pairs: PairedNodeStats[] = [];
    const notPaired: UnpairedNodeStats[] = [];
    
    const pairedRightMatches = new Set();
    
    for(const leftMatch of leftMatches) {
      let assigned = false;
      
      for(const rightMatch of rightMatches) {
        const is = intersect(leftMatch.occurrences, rightMatch.occurrences);
        if(is.size > leftMatch.occurrences.size*0.7
          && is.size > rightMatch.occurrences.size * 0.7) {
          pairs.push({ leftMatch, rightMatch });
          assigned = true;
          pairedRightMatches.add(rightMatch);
        }
      }
      
      if(!assigned) {
        const occs = new Array(...leftMatch.occurrences)
          .map(n => occurrenceGroups[n])
          .flat()
          .filter(o => o.file.id === fileRight.id);
        notPaired.push({ leftMatch, occurrences: occs });
      }
    }
    
    
    for(const rightMatch of rightMatches) {
      if(!pairedRightMatches.has(rightMatch)) {
        const occs = new Array(...rightMatch.occurrences)
          .map(n => occurrenceGroups[n])
          .flat()
          .filter(o => o.file.id === fileLeft.id);
        notPaired.push({ rightMatch, occurrences: occs });
      }
    }

    return [pairs, notPaired];
  }

}