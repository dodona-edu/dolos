import { TokenHash } from "./tokenHash.js";

export interface Fingerprint {
  data: Array<string> | null;
  hash: number;
  start: number;
  stop: number;
}

export abstract class HashFilter {

  protected hasher: TokenHash = new TokenHash();
  protected readonly kgramData: boolean;

  protected constructor(kgramData = false) {
    this.kgramData = kgramData;
  }


  public async *hashTokens(tokens: string[]): AsyncGenerator<[number, string]> {
    for (const token of tokens) {
      yield [this.hasher.hashToken(token), token];
    }
  }

  public abstract fingerprints(tokens: string[]): AsyncIterableIterator<Fingerprint>;
}
