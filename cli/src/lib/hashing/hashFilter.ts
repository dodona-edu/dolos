import { TokenHash } from "./tokenHash";

export interface Fingerprint {
  data: Array<string> | null;
  hash: number;
  start: number;
  stop: number;
}

export abstract class HashFilter {

  protected hasher: TokenHash = new TokenHash();
  protected readonly kmerData: boolean;

  protected constructor(kmerData = false) {
    this.kmerData = kmerData;
  }


  public async *hashTokens(tokens: string[]): AsyncGenerator<[number, string]> {
    for (const token of tokens) {
      yield [this.hasher.hashToken(token), token];
    }
  }

  public abstract fingerprints(tokens: string[]): AsyncIterableIterator<Fingerprint>;
}
