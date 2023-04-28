import { File, Pair } from "@/api/models";
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
  return (
    Array.from(cluster).reduce((s, edge) => s + edge.similarity, 0) /
    cluster.size
  );
}

/**
 * Returns a map that projects every file (node) to every edge (Pair) that it belongs.
 * @param pairs set of all pairs
 * @param similarity cutoff similarity that belongs to the graph. Default is 0: everything belongs to the graph.
 * @returns map of file => pair
 */
export function getClusteringGraph(
  pairs: Set<Pair>,
  similarity = 0
): ClusteringGraph {
  const map = new ListMap<number, Edge>();
  for (const pair of pairs) {
    if (pair.similarity >= similarity) {
      map.addValue(pair.leftFile.id, pair);
      map.addValue(pair.rightFile.id, pair);
    }
  }
  return map;
}

export function getClusterElementsSorted(cluster: Cluster): File[] {
  const array = getClusterElementsArray(cluster);
  const graph = getClusteringGraph(cluster);

  const getAverageSimilarity = (f: File): number => {
    const fGraph = graph.get(f.id);
    if (!fGraph) return 0;
    return fGraph.reduce((a, b) => a + b.similarity, 0) / fGraph.length;
  };

  // Cache weights for use in sort function (for efficiency reasons)
  const weights = new Map(array.map(f => [f.id, getAverageSimilarity(f)]));

  const sortf = (a: File, b: File): number => (weights.get(a.id) ?? 0) - (weights.get(b.id) ?? 0);

  return array.sort(sortf);
}

export function getClusterIntersect(cluster1: Cluster, cluster2: Cluster): Cluster {
  return new Set(Array.from(cluster1).filter(c => cluster2.has(c)));
}
