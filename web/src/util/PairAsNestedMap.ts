import { Pair } from "@/api/models";

export function pairsAsNestedMap(
  pairs: Pair[]
): Map<number, Map<number, Pair>> {
  const map = new Map();

  for (const pair of pairs) {
    if (!map.has(pair.leftFile.id)) map.set(pair.leftFile.id, new Map());
    map.get(pair.leftFile.id).set(pair.rightFile.id, pair);

    if (!map.has(pair.rightFile.id)) map.set(pair.rightFile.id, new Map());

    map.get(pair.rightFile.id).set(pair.leftFile.id, pair);
  }
  return map;
}
let _pairsAsNestedMapCached: Map<number, Map<number, Pair>> | null = null;

export function pairsAsNestedMapCached(pairs:() => Pair[]): Map<number, Map<number, Pair>> {
  if (!_pairsAsNestedMapCached) {
    _pairsAsNestedMapCached = pairsAsNestedMap(pairs());
  }

  return _pairsAsNestedMapCached;
}
