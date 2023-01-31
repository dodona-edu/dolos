import { File, Pair } from "@/api/models";
import { getClusterElements, getClusteringGraph } from "./ClusterFunctions";
import { Cluster, Clustering, ClusteringGraph } from "./ClusterTypes";

export function singleLinkageCluster(
  pairs: Pair[],
  files: File[],
  similarity: number
): Clustering {
  const clusterGraph = getClusteringGraph(new Set(pairs), similarity);
  const alreadySeenFileSet = new Set<number>();

  const clusters: Cluster[] = [];

  for (const file of files) {
    // Don't find duplicate clusters
    if (!alreadySeenFileSet.has(file.id)) {
      // Get the cluster associated with this file
      const cluster = exploreCluster(file.id, clusterGraph, similarity);

      // If it's actually connected to something, add it to the clusters list
      if (getClusterElements(cluster).size > 1) {
        clusters.push(cluster);
        getClusterElements(cluster).forEach(el => alreadySeenFileSet.add(el.id));
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
  const cluster = currentCluster ?? new Set();

  // Find applicable neighbours and add them
  const neighbours = graph
    .get(currentNode)
    ?.filter(nb => !cluster.has(nb)) // no double edges
    .filter(nb => nb.similarity >= similarity); // above minimum similarity

  neighbours?.forEach(n => cluster.add(n));

  // Continue cluster exploration with newly found neighbours
  neighbours?.forEach(n => {
    exploreCluster(n.leftFile.id, graph, similarity, cluster);
    exploreCluster(n.rightFile.id, graph, similarity, cluster);
  });

  return cluster;
}
