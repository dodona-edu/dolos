export class ListMap<K, V> extends Map<K, V[]> {
  addValue(key: K, value: V): void {
    if (!this.has(key)) this.set(key, []);

    this.get(key)?.push(value);
  }
}
