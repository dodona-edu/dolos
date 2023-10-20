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


  public hashTokens(tokens: string[]): Array<[number, string]> {
    const hashes: Array<[number, string]> = [];
    for (const token of tokens) {
      hashes.push([this.hasher.hashToken(token), token]);
    }
    return hashes;
  }

  public abstract fingerprints(tokens: string[]): Array<Fingerprint>;
}
