export interface CustomOptions {
  base?: string;
  clusterMinMatches?: number;
  comment?: string;
  directory?: boolean;
  kmerLength?: number;
  kmersInWindow?: number;
  language?: string;
  maxGapSize?: number;
  maxHashCount?: number;
  maxHashPercent?: number;
  maxMatches?: number;
  minFragmentLength?: number;
}

function definedOrNull<T extends any>(arg: T | undefined): T | null {
  return arg !== undefined ? arg : null;
}

function definedOrDefault<T extends any>(arg: T | undefined, def: T): T {
  return arg !== undefined ? arg : def;
}

export class Options {

  public static defaultDirectory = false;
  public static defaultKmerLength = 50;
  public static defaultKmersInWindow = 40;
  public static defaultLanguage = "javascript";
  public static defaultMaxHashPercentage = 0.9;
  public static defaultMinFragmentLength = 0;
  public static defaultMaxGapSize = 0;
  public static defaultClusterMinMatches = 15;

  private custom: CustomOptions = {};

  constructor(custom?: CustomOptions) {
    if (custom !== undefined) {
      this.custom = custom ;
    }
    Object.freeze(this);
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
    return definedOrDefault(this.custom.kmersInWindow, Options.defaultKmersInWindow);
  }

  get filterByPercentage(): boolean {
    return this.custom.maxHashCount === undefined;
  }

  get maxHash(): number {
    return definedOrDefault(this.custom.maxHashCount, this.maxHashPercent);
  }

  get maxHashPercent(): number {
    return definedOrDefault(this.custom.maxHashPercent, Options.defaultMaxHashPercentage);
  }

  get comment(): string | null {
    return definedOrNull(this.custom.comment);
  }

  get minFragmentLength(): number {
    return definedOrDefault(this.custom.minFragmentLength, Options.defaultMinFragmentLength);
  }

  get maxGapSize(): number {
    return definedOrDefault(this.custom.maxGapSize, Options.defaultMaxGapSize);
  }

  get clusterMinMatches(): number {
    return definedOrDefault(this.custom.clusterMinMatches, Options.defaultClusterMinMatches);
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
      maxHashPercent: this.filterByPercentage ? this.maxHashPercent : undefined,
      maxMatches: this.maxMatches,
      minFragmentLength: this.minFragmentLength,
    } as any);
  }
}
