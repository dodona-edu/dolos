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

export function sumByKey<V>(dict1: Map<V, number>, dict2: Map<V, number>) {
  const copy = new Map(dict2);

  for(const [key, count] of dict1) {
    copy.set(key, (copy.get(key) || 0) + count);
  }

  return copy;
}

export function combineByKey<K, V>(dict1: Map<K, V[]>, dict2: Map<K, V[]>)  {
  const copy = new Map([...dict2.entries()].map(([key, values]) => [key, [...values]]));

  for(const [key, values] of dict1) {
    copy.set(key, [...(copy.get(key) || []), ...values]);
  }

  return copy;
}