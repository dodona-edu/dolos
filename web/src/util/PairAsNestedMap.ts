import { Pair } from "@/api/api";

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
