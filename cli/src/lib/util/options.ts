export interface DolosOptions {
  kmerLength: number;
  kmersInWindow: number;
  language: string;
  limitResults: number | null;
  maxHashCount: number | null;
  maxHashPercentage: number | null;
  minBlockLength: number;
  minSimilarity: number;
  localPort: number;
  sortBy: string | null;
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

  public static defaultKmerLength = 50;
  public static defaultKmersInWindow = 40;
  public static defaultLanguage = "javascript";
  public static defaultMinBlockLength = 0;
  public static defaultMinSimilarity = 0;
  public static defaultPort = 3000;
  public static defaultSortBy = "total";

  private custom: CustomOptions = {};

  constructor(custom?: CustomOptions) {
    if (custom !== undefined) {
      this.custom = custom ;
    }

    const errors = [
      validatePercentage("minSimilarity", this.minSimilarity),
      validatePercentage("maxHashPercentage", this.maxHashPercentage),
      validatePositiveInteger("minBlockLength", this.minBlockLength),
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

  get minBlockLength(): number {
    return definedOrDefault(
      this.custom.minBlockLength,
      Options.defaultMinBlockLength
    );
  }

  get minSimilarity(): number {
    return definedOrDefault(
      this.custom.minSimilarity,
      Options.defaultMinSimilarity
    );
  }

  get localPort(): number {
    return definedOrDefault(this.custom.localPort, Options.defaultPort);
  }

  get sortBy(): string {
    return definedOrDefault(this.custom.sortBy, Options.defaultSortBy);
  }

  public asObject(): DolosOptions {
    return {
      kmerLength: this.kmerLength,
      kmersInWindow: this.kmersInWindow,
      language: this.language,
      maxHashCount: this.custom.maxHashCount || null,
      maxHashPercentage: this.maxHashPercentage,
      minBlockLength: this.minBlockLength,
      limitResults: this.limitResults,
      localPort: this.localPort,
      minSimilarity: this.minSimilarity,
      sortBy: this.sortBy,
    };
  }

  public toString(): string {
    return JSON.stringify(this.asObject());
  }
}
