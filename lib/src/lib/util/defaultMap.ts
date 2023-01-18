
export class DefaultMap<K, V> {

  private map: Map<K, V>;

  constructor(
    private readonly computeDefault: (key: K) => V,
    keyValues?: Array<[K, V]>
  ){
    this.map = new Map(keyValues);
  }

  public has(key: K): boolean {
    return this.map.has(key);
  }

  public set(key: K, value: V): DefaultMap<K, V> {
    this.map.set(key, value);
    return this;
  }

  public get(key: K): V {
    if (!this.has(key)) {
      this.map.set(key, this.computeDefault(key));
    }
    // we can be sure this is not undefined, we've just added the key
    return this.map.get(key) as V;
  }

  public keys(): IterableIterator<K> {
    return this.map.keys();
  }

  public values(): IterableIterator<V> {
    return this.map.values();
  }

  public entries(): IterableIterator<[K, V]> {
    return this.map.entries();
  }

  get size(): number {
    return this.map.size;
  }
}
