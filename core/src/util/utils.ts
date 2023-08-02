export function assert(condition: boolean, message?: string): asserts condition {
  if(!condition) {
    throw new Error(message || "Assertion failed");
  }
}

export function assertDefined(object?: unknown, message?: string): asserts object is NonNullable<typeof object> {
  if(object === undefined) {
    throw new Error(message || "Unexpected undefined value");
  }
  if(object === null) {
    throw new Error(message || "Unexpected null value");
  }
}

export function closestMatch<V>(input: string, options: {[key: string]: V}): V | null {
  for(const key of Object.keys(options)) {
    if(key.startsWith(input)) {
      return options[key];
    }
  }
  return null;
}

export function countByKey<V>(list: Array<V>): Map<V, number> {
  const dict = new Map();

  for(const val of list) {
    dict.set(val, (dict.get(val) || 0) + 1);
  }

  return dict;
}

export function sumByKey<V>(dict1: Map<V, number>, dict2: Map<V, number>): Map<V, number> {
  const copy = new Map(dict2);

  for(const [key, count] of dict1) {
    copy.set(key, (copy.get(key) || 0) + count);
  }

  return copy;
}

export function combineByKey<K, V>(dict1: Map<K, V[]>, dict2: Map<K, V[]>): Map<K,V[]>  {
  const copy = new Map(dict2);

  for(const [key, values] of dict1) {
    copy.set(key, (copy.get(key) || []).concat(values));
  }

  return copy;
}

export function intersect<T>(set1: Set<T>, set2: Set<T>): Set<T> {
  const copy = new Set(set1);

  for(const el of set1) {
    if(!set2.has(el)) {
      copy.delete(el);
    }
  }

  return copy;
}

export function mapValues<K, V1, V2>(mapper: (a: V1) => V2, map: Map<K, V1>): Map<K, V2> {
  return new Map(
    Array.from(map.entries()).map(([key, val]) => [key, mapper(val)])
  );
}

export function serializeMap<K, V>(map: Map<K, V>): Array<[K, V]> {
  return serializeMapC(map, v => v);
}

export function serializeMapC<K, V, R>(map: Map<K, V>, internalMapper: (a: V) => R): Array<[K, R]> {
  const workingMap: Map<K, R> = mapValues(internalMapper, map);


  return [...workingMap.entries()];
}

export function deserializeMapC<K, V, R>(map: Array<[K, V]>, internalMapper: (a: V) => R): Map<K, R> {
  const workingArray = map.map(([key, value]): [K, R] => [key, internalMapper(value)]);

  return new Map(workingArray);
}

export function deserializeMap<K, V>(map: Array<[K, V]>): Map<K, V> {
  return deserializeMapC(map, v => v);
}
