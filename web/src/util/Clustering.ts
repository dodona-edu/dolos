import { ObjMap, Pair, File } from "@/api/api";
import { Cluster, Edge } from "./Cluster";
import { ListMap } from "./ListMap";

export type Clustering = Cluster[];
type ClusteringGraph = ListMap<number, Edge>;

export function cluster(
  pairs: ObjMap<Pair>,
  files: ObjMap<File>,
  similarity: number
): Clustering {
  const clusterGraph = getGraph(pairs);
  const alreadySeenFileSet = new Set<number>();

  const clusters = [];

  for (const fileIndex in files) {
    const file = files[fileIndex];
    // Don't find duplicate clusters
    if (!alreadySeenFileSet.has(file.id)) {
      // Get the cluster associated with this file
      const cluster = exploreCluster(file.id, clusterGraph, similarity);

      // If it's actually connected to something, add it to the clusters list
      if (cluster.getElementSize() > 1) {
        clusters.push(cluster);
        cluster.getElements().forEach(el => alreadySeenFileSet.add(el));
      }
    }
  }

  return clusters;
}

function exploreCluster(
  currentNode: number,
  graph: ClusteringGraph,
  similarity: number,
  currentCluster?: Cluster
): Cluster {
  const cluster = currentCluster ?? new Cluster(currentNode);

  // Find applicable neighbours and add them
  const neighbours = graph
    .get(currentNode)
    ?.filter(nb => !cluster.hasEdge(nb)) // no double edges
    .filter(nb => nb.data.similarity > similarity); // above minimum similarity

  neighbours?.forEach(n => cluster.add(n));

  // Continue cluster exploration with newly found neighbours
  neighbours?.forEach(n =>
    exploreCluster(n.target, graph, similarity, cluster)
  );

  return cluster;
}

function getGraph(pairs: ObjMap<Pair>): ClusteringGraph {
  const map = new ListMap<number, Edge>();

  for (const pairIndex in pairs) {
    const pair = pairs[pairIndex];
    map.addValue(pair.leftFile.id, { target: pair.rightFile.id, data: pair });
    map.addValue(pair.rightFile.id, { target: pair.leftFile.id, data: pair });
  }
  return map;
}
