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

type AnnotatedAst = DefaultMap<number, boolean>;
export type LevelStats = {
    ownNodes: number[],
    matchedNodeAmount: number,
    childrenMatch: number,
    childrenTotal: number,
    depth: number,
    currentI: number,
    lastMatchedLevels?: LevelStats[],
    matches?: boolean
}

export class SemanticAnalyzer {

  constructor(private index: Index) {}

  public async semanticAnalysis(
    tokenizedFiles: TokenizedFile[],
    hashFilter?: HashFilter
  ) {
    const results = [];
    const astMap = await this.setupASTMatching(tokenizedFiles, hashFilter);
    for(const tokenizedFile of tokenizedFiles) {
      results.push(await this.semanticAnalysisOneFile(tokenizedFile, astMap.get(tokenizedFile)));
    }
    return results;
  }

  private async semanticAnalysisOneFile(
    tokenizedFile: TokenizedFile,
    matchedAST: AnnotatedAst,
  ): Promise<LevelStats[]> {
    const last = this.recurse(0, tokenizedFile.ast, matchedAST, 0);
    const matchedLevels = last.lastMatchedLevels;
    if(!matchedLevels)
      return [];

    return matchedLevels.filter(lm => lm.childrenTotal + lm.ownNodes.length > 10);
  }

  private recurse(i: number, ast: string[], matchedAST: AnnotatedAst, depth: number): LevelStats {
    const currentNodelist: number[] = [];
    const currentChildren: LevelStats[] = [];

    let index = i;
    let currentNode = ast[index];
    while(currentNode != ")" && index < ast.length) {
      if(currentNode !== "(" && currentNode !== ")") {
        // Handle node
        currentNodelist.push(index);

      } else if (currentNode == "(") {
        // Handle start of child
        const r = (this.recurse(index+1, ast, matchedAST, depth+1));
        index = r.currentI;
        currentChildren.push(r);
      }

      index += 1;
      currentNode = ast[index];
    }

    const matchedNodeAmount = currentNodelist.filter(i => matchedAST.get(i)).length;

    const levelData: LevelStats = {
      ownNodes: currentNodelist,
      matchedNodeAmount,
      childrenMatch: currentChildren.reduce((a, b) => a + b.matchedNodeAmount + b.childrenMatch, 0),
      childrenTotal:
                    currentChildren.reduce((a, b) => a + b.childrenTotal + b.ownNodes.length, 0),
      depth,
      currentI: index
    };

    levelData.matches = this.doesLevelMatch(levelData);

    levelData.lastMatchedLevels = levelData.matches ?
      [levelData] :
      currentChildren.map(c => c.lastMatchedLevels).filter((e): e is LevelStats[] => !!e).flat();

    return levelData;
  }

  private doesLevelMatch(level: LevelStats): boolean {

    return level.childrenMatch > level.childrenTotal * 0.7  ||
            (level.childrenMatch  > level.childrenTotal * 0.6 && level.matchedNodeAmount> level.ownNodes.length * 0.6);
  }

  private async setupASTMatching(
    tokenizedFiles: TokenizedFile[],
    hashFilter?: HashFilter
  ): Promise<DefaultMap<TokenizedFile, AnnotatedAst>> {

    const astMap = new DefaultMap<TokenizedFile, AnnotatedAst>(() => new DefaultMap(() => false));

    const occurrenceMap = await this.index.createMatches(tokenizedFiles, hashFilter);
    const occurrences = [...occurrenceMap.values()].filter(u => u.length > 1).flat();

    for(const occurence of occurrences) {
      const matchMap = astMap.get(occurence.file);
      for(let i = occurence.side.start; i <= occurence.side.stop; i++) {
        matchMap.set(i, true);
      }
    }

    return astMap;
  }

}