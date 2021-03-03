export class TokenHash {
  private readonly mod: number;
  private readonly base: number;

  constructor() {
    this.mod = 33554467;
    this.base = 5801;
  }

  public hashToken(token: string): number {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = (this.base * hash + token.charCodeAt(i)) % this.mod;
    }
    return hash;
  }
}