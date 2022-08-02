import { Pair } from "@/api/models";

export type Edge = { target: number; data: Pair };

export class Cluster {
  private clusterElements = new Set<number>();
  private edges = new Set<Edge>();

  constructor(startElement: number) {
    this.clusterElements.add(startElement);
  }

  public getElementSize(): number {
    return this.clusterElements.size;
  }

  public getElements(): Set<number> {
    return this.clusterElements;
  }

  public getEdges(): Set<Edge> {
    return this.edges;
  }

  public add(e: Edge): void {
    this.edges.add(e);
    this.clusterElements.add(e.target);
  }

  public hasEdge(e: Edge): boolean {
    return this.edges.has(e);
  }

  public getAverageSimilarity(): number {
    const edges = this.getEdges().size;

    return Array.from(this.getEdges()).reduce((n, edge) => n + edge.data.similarity, 0) / edges;
  }
}
