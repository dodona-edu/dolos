export default class HashIndex {
  public table: Array<Array<[string, number]>> = [];

  public async add(name: string, hashes: AsyncIterableIterator<[number, number]>): Promise<void> {
    for await (const [hash, position] of hashes) {
      if (this.table[hash] === undefined) {
        this.table[hash] = [];
      }
      this.table[hash].push([name, position]);
    }
  }

  public async compare(
    hashes: AsyncIterableIterator<[number, number]>,
  ): Promise<Map<string, Array<[number, number]>>> {
    const found: Map<string, Array<[number, number]>> = new Map();
    for await (const [hash, position] of hashes) {
      const other = this.table[hash];
      if (other !== undefined) {
        for (const [name, otherPos] of other) {
          const g = found.get(name);
          if (g === undefined) {
            found.set(name, [[position, otherPos]]);
          } else {
            g.push([position, otherPos]);
          }
        }
      }
    }
    return found;
  }
}
