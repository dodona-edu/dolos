import { CodeTokenizer } from "../codeTokenizer";
import { Comparison, ComparisonOptions, Matches } from "../comparison";
import { Range } from "../range";
import { FilterOptions, RangesTuple, Summary } from "../summary";
import { Tokenizer } from "../tokenizer";

const defaultFilterOptions: FilterOptions = {
  minimumFragmentLength: 1,
};
const defaultComparisonOptions: ComparisonOptions = {
  filterHashByPercentage: undefined,
};

const defaultGapSize: number = 1;

async function match(file1: string, file2: string): Promise<RangesTuple[]> {
  const tokenizer: Tokenizer<number> = new CodeTokenizer("javascript");
  const comparison: Comparison<number> = new Comparison(tokenizer, defaultComparisonOptions);
  await comparison.addFile(file1);

  const matchesPerFile: Map<string, Matches<number>> = await comparison.compareFiles([file2]);

  const filterOptions: FilterOptions = defaultFilterOptions;
  const summary = new Summary(matchesPerFile, defaultGapSize, filterOptions, 0);

  if (!summary.results.has(file2)) {
    return [];
  }
  const results: Matches<Range> = summary.results.get(file2) as Matches<Range>;

  if (!results.has(file1)) {
    return [];
  }

  return results.get(file1) as RangesTuple[];
}

function toRangesTuple([[from1, to1], [from2, to2]]: NumericRangesTuple): RangesTuple {
  return [new Range(from1 - 1, to1 - 1), new Range(from2 - 1, to2 - 1)];
}

const benchMarks: Map<string, () => Promise<void>> = new Map();
async function benchmark(benchmarkName: string, benchmarkFunction: () => Promise<void>) {
  benchMarks.set(benchmarkName, benchmarkFunction);
}

async function executeBenchmarks() {
  for (const [name, benchmarkFunction] of benchMarks.entries()) {
    console.info(`Benchmark: ${name}`);
    await benchmarkFunction();
  }
}
type NumericRangesTuple = [[number, number], [number, number]];
class BenchmarkMatcher {
  private readonly expected: RangesTuple[];
  private readonly dataStructure: RangesTuple[][];

  private readonly map: Array<
    Array<boolean | ((rt1: RangesTuple, rt2: RangesTuple) => boolean)>
  > = [
    [true, false, this.isAcceptableRatio, this.isAcceptableRatio],
    [false, true, this.isAcceptableRatio, this.isAcceptableRatio],
    [this.isAcceptableRatio, this.isAcceptableRatio, true, false],
    [this.isAcceptableRatio, this.isAcceptableRatio, false, true],
  ];
  private readonly file1LinesStates: LineState[] = new Array();
  private readonly file2LinesStates: LineState[] = new Array();
  constructor(expected: NumericRangesTuple[]) {
    const mapped: RangesTuple[] = expected.map(expectedValue => toRangesTuple(expectedValue));
    this.expected = mapped;
    this.dataStructure = new Array();
    for (const [range1, range2] of this.expected.values()) {
      for (let index = range1.from; index <= range1.to; index += 1) {
        let subArray: RangesTuple[] = this.dataStructure[index];
        if (subArray === undefined) {
          subArray = new Array();
          this.dataStructure[index] = subArray;
        }
        subArray.push([range1, range2]);
      }
    }
  }

  public toContain(actual: RangesTuple[]) {
    let matchedLines: number = 0; // A line appears in both the expected and actual ranges
    let missedLines: number = 0; // When a line is expected but not seen in the actual ranges.
    let falseLines: number = 0; // When a line appears in the actual ranges but is not expected.
    let falseMatches: number = 0;
    let falseMatchingLines: number = 0;

    for (const actualRT of actual.values()) {
      let hasAMatch: boolean = false;
      for (const expectedRT of this.getMatchingRangesTuples(actualRT[0])) {
        if (this.isAcceptedCombination(actualRT, expectedRT)) {
          hasAMatch = true;
          this.applyLineStates(actualRT[0], expectedRT[0], true);
          this.applyLineStates(actualRT[1], expectedRT[1], true);
        }
      }
      if (!hasAMatch) {
        falseMatches += 1;
        falseMatchingLines += actualRT[0].getLineCount() + actualRT[1].getLineCount();
      }
    }

    for (const [, lineState] of this.file1LinesStates.entries()) {
      switch (lineState) {
        case LineState.Hit:
          matchedLines += 1;
          break;
        case LineState.Miss:
          missedLines += 1;
          break;
        case LineState.FalseHit:
          falseLines += 1;
          break;
      }
    }
    for (const [, lineState] of this.file2LinesStates.entries()) {
      switch (lineState) {
        case LineState.Hit:
          matchedLines += 1;
          break;
        case LineState.Miss:
          missedLines += 1;
          break;
        case LineState.FalseHit:
          falseLines += 1;
          break;
      }
    }

    console.info(
      `\tmatchedLines: ${matchedLines}, missedLines: ${missedLines}, falseLines: ${falseLines}, ` +
        `falseMatches: ${falseMatches}, falseMatchingLines: ${falseMatchingLines}`,
    );
  }

  // @ts-ignore; TODO
  private isAcceptableRatio(rt1: RangesTuple, tr2: RangesTuple): boolean {
    return true;
  }

  private isAcceptedCombination(actualRT: RangesTuple, expectedRT: RangesTuple): boolean {
    if (
      actualRT[0].overlappingLinesAmount(expectedRT[0]) <= 0 ||
      actualRT[1].overlappingLinesAmount(expectedRT[1]) <= 0
    ) {
      return false;
    }
    const type1 = this.getType(actualRT);
    const type2 = this.getType(expectedRT);

    const returnValue = this.map[type1][type2];
    if (typeof returnValue === "boolean") {
      return returnValue as boolean;
    } else {
      return returnValue(actualRT, expectedRT);
    }
  }
  private getType([r1, r2]: RangesTuple): 0 | 1 | 2 | 3 {
    if (r1.to < r2.to && r1.from > r2.from) {
      return 0;
    } else if (r2.to < r1.to && r2.from > r1.from) {
      return 1;
    } else if (r1.to <= r2.to && r1.from <= r2.from) {
      return 2;
    } else {
      return 3;
    }
  }
  private applyLineStates(range1: Range, range2: Range, firstFile: boolean) {
    const fileStates: LineState[] = firstFile ? this.file1LinesStates : this.file2LinesStates;
    // TODO
    for (
      let lineNumber = Math.min(range1.from, range2.from);
      lineNumber <= Math.max(range1.to, range2.to);
      lineNumber += 1
    ) {
      let lineState: LineState;
      const inRange1 = range1.includes(lineNumber);
      const inRange2 = range2.includes(lineNumber);
      if (inRange1 && inRange2) {
        lineState = LineState.Hit;
      } else if (inRange1 && !inRange2) {
        lineState = LineState.Miss;
      } else if (!inRange1 && inRange2) {
        lineState = LineState.FalseHit;
      } else {
        continue;
      }

      fileStates[lineNumber] = getHigherPrecedence(fileStates[lineNumber], lineState);
    }
  }
  private getMatchingRangesTuples(range: Range): Set<RangesTuple> {
    const returnSet: Set<RangesTuple> = new Set();
    for (let index = range.from; index <= range.to; index += 1) {
      const rangesTupleArray = this.dataStructure[index] || [];
      rangesTupleArray.forEach(rangesTuple => returnSet.add(rangesTuple));
    }
    return returnSet;
  }
}

enum LineState {
  Hit, // A line is both expected and confirmed
  Miss, // A line is expected but not confirmed
  FalseHit, // A line is confirmed but not expected
}

function getHigherPrecedence(lineState1: LineState | undefined, lineState2: LineState): LineState {
  if (lineState1 === undefined) {
    return lineState2;
  } else if (lineState1 === lineState2) {
    return lineState1;
  } else if (lineState1 === LineState.Hit || lineState2 === LineState.Hit) {
    return LineState.Hit;
  } else {
    throw Error("Cannot compare a FalseHit and a miss");
  }
}

function expect(actual: NumericRangesTuple[]): BenchmarkMatcher {
  return new BenchmarkMatcher(actual);
}

benchmark("basic file match", async () => {
  const matches: RangesTuple[] = await match(
    "samples/js/sample.js",
    "samples/js/copied_function.js",
  );
  const temp = [[[15, 20], [4, 9]]];
  console.log(temp);
  console.log(matches);

  expect(temp as NumericRangesTuple[]).toContain(matches);
});

executeBenchmarks();
