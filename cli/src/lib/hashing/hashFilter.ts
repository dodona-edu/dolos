import { TokenHash } from "./tokenHash";

export interface Fingerprint {
  data: Array<string>;
  hash: number;
  start: number;
  stop: number;
}

export abstract class HashFilter {

  protected hasher: TokenHash = new TokenHash();

  public async *hashTokens(tokens: string[]): AsyncGenerator<[number, string]> {
    for (const token of tokens) {
      yield [this.hasher.hashToken(token), token];
    }
  }

  public abstract fingerprints(tokens: string[]): AsyncIterableIterator<Fingerprint>;
}
