export interface DolosOptions {
  reportName?: string | undefined;
  kgramLength: number;
  kgramsInWindow: number;
  language: string | null;
  limitResults: number | null;
  maxFingerprintCount: number | null;
  maxFingerprintPercentage: number | null;
  minFragmentLength: number;
  minSimilarity: number;
  sortBy: string | null;
  fragmentSortBy: string | null;
  kgramData: boolean;
  includeComments: boolean;
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

  public static defaultKgramLength = 23;
  public static defaultKgramsInWindow = 17;
  public static defaultMinFragmentLength = 0;
  public static defaultMinSimilarity = 0;
  public static defaultSortBy = "total";
  public static defaultFragmentSortBy = "none";

  private custom: CustomOptions = {};

  constructor(custom?: CustomOptions) {
    if (custom !== undefined) {
      this.custom = custom ;
    }

    const errors = [
      validatePercentage("minSimilarity", this.minSimilarity),
      validatePercentage("maxFingerprintPercentage", this.maxFingerprintPercentage),
      validatePositiveInteger("minFragmentLength", this.minFragmentLength),
      validatePositiveInteger("maxFingerprintCount", this.maxFingerprintCount),
      validatePositiveInteger("limitResults", this.limitResults),
      validatePositiveInteger("kgramLength", this.kgramLength),
      validatePositiveInteger("kgramsInWindow", this.kgramsInWindow),
    ].filter(err => err !== null);

    if (errors.length > 0) {
      throw new Error(
        `The following options are invalid:\n${errors.join("\n")}`
      );
    }
    Object.freeze(this);
  }

  get reportName(): string | undefined {
    return this.custom.reportName;
  }

  get kgramData(): boolean {
    return this.custom.kgramData == true;
  }

  get includeComments(): boolean {
    return this.custom.includeComments === true;
  }

  get limitResults(): number | null {
    return definedOrNull(this.custom.limitResults);
  }

  get language(): string | null {
    return definedOrNull(this.custom.language);
  }

  get kgramLength(): number {
    return definedOrDefault(this.custom.kgramLength, Options.defaultKgramLength);
  }

  get kgramsInWindow(): number {
    return definedOrDefault(
      this.custom.kgramsInWindow,
      Options.defaultKgramsInWindow
    );
  }

  get filterByPercentage(): boolean {
    return this.custom.maxFingerprintCount === undefined;
  }

  get maxFingerprintCount(): number | null {
    return definedOrNull(this.custom.maxFingerprintCount);
  }

  get maxFingerprintPercentage(): number | null {
    return definedOrNull(this.custom.maxFingerprintPercentage);
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

  get sortBy(): string {
    return definedOrDefault(this.custom.sortBy, Options.defaultSortBy);
  }

  get fragmentSortBy(): string {
    return definedOrDefault(this.custom.fragmentSortBy, Options.defaultFragmentSortBy);
  }

  public asObject(): DolosOptions {
    return {
      reportName: this.reportName,
      kgramLength: this.kgramLength,
      kgramsInWindow: this.kgramsInWindow,
      language: this.language,
      maxFingerprintCount: this.custom.maxFingerprintCount || null,
      maxFingerprintPercentage: this.maxFingerprintPercentage,
      minFragmentLength: this.minFragmentLength,
      limitResults: this.limitResults,
      minSimilarity: this.minSimilarity,
      sortBy: this.sortBy,
      fragmentSortBy: this.fragmentSortBy,
      kgramData: this.kgramData,
      includeComments: this.includeComments,
    };
  }

  public toString(): string {
    return JSON.stringify(this.asObject());
  }
}
