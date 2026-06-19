import { describe, it, expect } from "vitest";
import { singleLinkageCluster } from "./SingleLinkageClustering";
import { getClusterElements } from "./ClusterFunctions";
import { createFile, createPair } from "@/test/fixtures";

describe("singleLinkageCluster", () => {
  const files = [createFile(1), createFile(2), createFile(3), createFile(4)];

  it("merges transitively connected files into one cluster", () => {
    // 1-2 and 2-3 connected => {1,2,3} one cluster; 4 isolated.
    const pairs = [
      createPair(1, files[0], files[1], 0.9),
      createPair(2, files[1], files[2], 0.9),
    ];

    const clusters = singleLinkageCluster(pairs, files, 0.5);

    expect(clusters).toHaveLength(1);
    const ids = new Set(Array.from(getClusterElements(clusters[0])).map((f) => f.id));
    expect(ids).toEqual(new Set([1, 2, 3]));
  });

  it("keeps separate components in separate clusters", () => {
    const pairs = [
      createPair(1, files[0], files[1], 0.9),
      createPair(2, files[2], files[3], 0.9),
    ];

    const clusters = singleLinkageCluster(pairs, files, 0.5);

    expect(clusters).toHaveLength(2);
  });

  it("drops edges below the similarity threshold", () => {
    const pairs = [createPair(1, files[0], files[1], 0.3)];

    const clusters = singleLinkageCluster(pairs, files, 0.5);

    expect(clusters).toHaveLength(0);
  });
});
