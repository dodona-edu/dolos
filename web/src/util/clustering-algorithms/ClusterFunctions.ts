import { File, ObjMap, Pair } from "@/api/api";
import { ListMap } from "../ListMap";
import { Cluster, ClusteringGraph, Edge } from "./ClusterTypes";

export function getClusterElements(cluster: Cluster): Set<File> {
  const set = new Set<File>();

  cluster.forEach(v => set.add(v.leftFile));
  cluster.forEach(v => set.add(v.rightFile));

  return set;
}

export function getClusterElementsArray(cluster: Cluster): File[] {
  return Array.from(getClusterElements(cluster));
}

export function getAverageClusterSimilarity(cluster: Cluster): number {
  return Array.from(cluster).reduce((s, edge) => s + edge.similarity, 0) / cluster.size;
}

export function getClusteringGraph(pairs: ObjMap<Pair>): ClusteringGraph {
  const map = new ListMap<number, Edge>();

  for (const pairIndex in pairs) {
    const pair = pairs[pairIndex];
    map.addValue(pair.leftFile.id, pair);
    map.addValue(pair.rightFile.id, pair);
  }
  return map;
}
