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
import { Occurrence } from "./report";
import { countByKey, sumByKey } from "../util/utils";

type AstWithMatches = DefaultMap<number, Occurrence[]>;
// type AnnotatedAst = Map<number, NodeStats>;

export type NodeStats = {
    ownNodes: number[],
    matchedNodeAmount: Map<number, number>,
    childrenMatch: Map<number, number>,
    childrenTotal: number,
    depth: number,
}

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
  ): Promise<Array<Map<number, NodeStats[]>>> {
    console.log(tokenizedFiles);
    const results = [];
    const astMap = await this.astWithMatches(tokenizedFiles, hashFilter);
    for(const tokenizedFile of tokenizedFiles) {
      results.push(await this.semanticAnalysisOneFile(tokenizedFile, astMap.get(tokenizedFile)));
    }

    return results;
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


    const ownMatchesCountByFile = countByKey(
      ownNodes.map(n => matchedAST.get(n)).flat().map(n => n.file.id).filter(n => n !== fileId)
    );

    const totalChildrenMatchByFile = currentChildren
      .map(c => sumByKey(c.nodeStats.childrenMatch, c.nodeStats.matchedNodeAmount))
      .reduce(sumByKey, new Map());

    const totalChildrenCount = currentChildren.reduce(
      (a, b)  => a + b.nodeStats.childrenTotal + b.nodeStats.ownNodes.length, 0);


    const nodeStats = {
      ownNodes,
      matchedNodeAmount: ownMatchesCountByFile,
      childrenTotal: totalChildrenCount,
      childrenMatch: totalChildrenMatchByFile,
      depth,
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

    return childrenMatch > childrenTotal * 0.7 ||
        (childrenMatch > childrenTotal * 0.6 && ownMatch > ownNodes.length * 0.6);
  }


  private async astWithMatches(
    tokenizedFiles: TokenizedFile[],
    hashFilter?: HashFilter
  ): Promise<DefaultMap<TokenizedFile, AstWithMatches>> {

    const astMap = new DefaultMap<TokenizedFile, AstWithMatches>(() => new DefaultMap(() => []));

    const occurrenceMap = await this.index.createMatches(tokenizedFiles, hashFilter);
    const groupedOccurences = [...occurrenceMap.values()];

    for(const occurenceGroup of groupedOccurences) {
      if(occurenceGroup.length > 1)
        for (const occurence of occurenceGroup) {
          const matchMap = astMap.get(occurence.file);
          for (let i = occurence.side.start; i <= occurence.side.stop; i++) {
            matchMap.set(i, occurenceGroup);
          }
        }
    }
    return astMap;
  }

  public static getFullRange(file: TokenizedFile, match: NodeStats): Region {
    const ast = file.ast;
    const mapping = file.mapping;

    let currentRegion = mapping[match.ownNodes[0]];

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

}