import { describe, it, expect } from "vitest";
import {
  getClusterElements,
  getAverageClusterSimilarity,
  getClusteringGraph,
  getClusterIntersect,
} from "./ClusterFunctions";
import { Cluster } from "./ClusterTypes";
import { createFile, createPair } from "@/test/fixtures";

const f1 = createFile(1);
const f2 = createFile(2);
const f3 = createFile(3);

describe("getClusterElements", () => {
  it("collects the unique files on both sides of each pair", () => {
    const cluster: Cluster = new Set([
      createPair(1, f1, f2, 0.5),
      createPair(2, f2, f3, 0.6),
    ]);
    const elements = getClusterElements(cluster);
    expect(elements).toEqual(new Set([f1, f2, f3]));
  });
});

describe("getAverageClusterSimilarity", () => {
  it("averages the similarity over all pairs in the cluster", () => {
    const cluster: Cluster = new Set([
      createPair(1, f1, f2, 0.4),
      createPair(2, f2, f3, 0.6),
    ]);
    expect(getAverageClusterSimilarity(cluster)).toBeCloseTo(0.5, 6);
  });
});

describe("getClusteringGraph", () => {
  it("indexes every file to the pairs it participates in", () => {
    const ab = createPair(1, f1, f2, 0.9);
    const graph = getClusteringGraph(new Set([ab]));
    expect(graph.get(1)).toEqual([ab]);
    expect(graph.get(2)).toEqual([ab]);
  });

  it("excludes pairs below the similarity cutoff", () => {
    const low = createPair(1, f1, f2, 0.2);
    const graph = getClusteringGraph(new Set([low]), 0.5);
    expect(graph.get(1)).toBeUndefined();
  });
});

describe("getClusterIntersect", () => {
  it("returns the pairs common to both clusters", () => {
    const shared = createPair(1, f1, f2, 0.5);
    const only2 = createPair(2, f2, f3, 0.5);
    const c1: Cluster = new Set([shared, only2]);
    const c2: Cluster = new Set([shared]);
    expect(getClusterIntersect(c1, c2)).toEqual(new Set([shared]));
  });
});
