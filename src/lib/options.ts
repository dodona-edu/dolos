export interface CustomOptions {
  base?: string;
  clusterMinMatches?: number;
  comment?: string;
  directory?: boolean;
  language?: string;
  maxGapSize?: number;
  maxHashCount?: number;
  maxHashPercent?: number;
  maxMatches?: number;
  minFragmentLength?: number;
}

export class Options {

  public static defaultDirectory = false;
  public static defaultLanguage = "javascript";
  public static defaultMaxHashPercentage = 0.9;
  public static defaultMinFragmentLength = 2;
  public static defaultMaxGapSize = 0;
  public static defaultClusterMinMatches = 0;

  private custom: CustomOptions = {};

  constructor(custom?: CustomOptions) {
    if (custom !== undefined) {
      this.custom = custom ;
    }
  }

  get language() {
    return this.custom.language || Options.defaultLanguage;
  }

  get base() {
    return this.custom.base || null;
  }

  get directory() {
    if (this.custom.directory !== undefined) {
      return this.custom.directory;
    } else {
      return Options.defaultDirectory;
    }
  }

  get filterByPercentage() {
    return this.custom.maxHashCount === undefined;
  }

  get maxHash() {
    return this.custom.maxHashCount || this.maxHashPercent;
  }

  get maxHashPercent() {
    return this.custom.maxHashPercent || Options.defaultMaxHashPercentage;
  }

  get comment() {
    return this.custom.comment || null;
  }

  get minFragmentLength() {
    return this.custom.minFragmentLength || Options.defaultMinFragmentLength;
  }

  get maxGapSize() {
    return this.custom.maxGapSize || Options.defaultMaxGapSize;
  }

  get clusterMinMatches() {
    return this.custom.clusterMinMatches || Options.defaultClusterMinMatches;
  }

  get maxMatches() {
    return this.custom.maxMatches || null;
  }
}
