export interface DolosOptions {
  base: string | null;
  clusterMinMatches: number;
  comment: string | null;
  directory: boolean;
  kmerLength: number;
  kmersInWindow: number;
  language: string;
  limitResults: number | null;
  maxGapSize: number;
  maxHashCount: number | null;
  maxHashPercentage: number | null;
  maxMatches: number | null;
  minFragmentLength: number;
  minSimilarity: number;
}

export type CustomOptions = Partial<DolosOptions>;

function validatePercentage(
  prop: string,
  value: number | null
): string | null {

  if (value && (value < 0 || 1 < value)) {
    return `${prop} must be a fraction between 0 and 1, but was ${value}`;
  }
  return null;
}

function validatePositiveInteger(
  prop: string,
  value?: number | null
): string | null {

  if (value && (Number.isInteger(value) && value < 0)) {
    return `${prop} must be a positive integer, but was ${value}`;
  }
  return null;
}

function definedOrNull<T>(arg: T | undefined | null): T | null {
  return arg == null ? null : arg;
}

function definedOrDefault<T>(arg: T | undefined | null, def: T): T {
  return arg == null ? def : arg;
}

export class Options implements DolosOptions {

  public static defaultDirectory = false;
  public static defaultKmerLength = 50;
  public static defaultKmersInWindow = 40;
  public static defaultLanguage = "javascript";
  public static defaultMinFragmentLength = 0;
  public static defaultMinSimilarity = 0;
  public static defaultMaxGapSize = 0;
  public static defaultClusterMinMatches = 15;

  private custom: CustomOptions = {};

  constructor(custom?: CustomOptions) {
    if (custom !== undefined) {
      this.custom = custom ;
    }

    const errors = [
      validatePercentage("minSimilarity", this.minSimilarity),
      validatePercentage("maxHashPercentage", this.maxHashPercentage),
      validatePositiveInteger("maxGapSize", this.maxGapSize),
      validatePositiveInteger("minFragmentLength", this.minFragmentLength),
      validatePositiveInteger("maxHashCount", this.maxHashCount),
      validatePositiveInteger("limitResults", this.limitResults),
      validatePositiveInteger("kmerLength", this.kmerLength),
      validatePositiveInteger("kmersInWindow", this.kmersInWindow),
    ].filter(err => err !== null);

    if (errors.length > 0) {
      throw new Error(
        `The following options are invalid:\n${errors.join("\n")}`
      );
    }
    Object.freeze(this);
  }

  get limitResults(): number | null {
    return definedOrNull(this.custom.limitResults);
  }

  get language(): string {
    return definedOrDefault(this.custom.language, Options.defaultLanguage);
  }

  get base(): string | null {
    return definedOrNull(this.custom.base);
  }

  get directory(): boolean {
    return definedOrDefault(this.custom.directory, Options.defaultDirectory);
  }

  get kmerLength(): number {
    return definedOrDefault(this.custom.kmerLength, Options.defaultKmerLength);
  }

  get kmersInWindow(): number {
    return definedOrDefault(
      this.custom.kmersInWindow,
      Options.defaultKmersInWindow
    );
  }

  get filterByPercentage(): boolean {
    return this.custom.maxHashCount === undefined;
  }

  get maxHashCount(): number | null {
    return definedOrNull(this.custom.maxHashCount);
  }

  get maxHashPercentage(): number | null {
    return definedOrNull(this.custom.maxHashPercentage);
  }

  get comment(): string | null {
    return definedOrNull(this.custom.comment);
  }

  get minFragmentLength(): number {
    return definedOrDefault(
      this.custom.minFragmentLength,
      Options.defaultMinFragmentLength
    );
  }

  get minSimilarity(): number {
    return definedOrDefault(
      this.custom.minSimilarity,
      Options.defaultMinSimilarity
    );
  }

  get maxGapSize(): number {
    return definedOrDefault(this.custom.maxGapSize, Options.defaultMaxGapSize);
  }

  get clusterMinMatches(): number {
    return definedOrDefault(
      this.custom.clusterMinMatches,
      Options.defaultClusterMinMatches
    );
  }

  get maxMatches(): number | null {
    return definedOrNull(this.custom.maxMatches);
  }

  public toString(): string {
    return JSON.stringify({
      base: this.base,
      clusterMinMatches: this.clusterMinMatches,
      comment: this.comment,
      directory: this.directory,
      kmerLength: this.kmerLength,
      kmersInWindow: this.kmersInWindow,
      language: this.language,
      maxGapSize: this.maxGapSize,
      maxHashCount: this.custom.maxHashCount,
      maxHashPercentage: this.filterByPercentage
        ? this.maxHashPercentage
        : undefined,
      maxMatches: this.maxMatches,
      minFragmentLength: this.minFragmentLength,
    });
  }
}
