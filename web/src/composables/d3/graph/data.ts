export class Data {
  private nodesById: Map<number, D3Node> = new Map();
  private edgesById: Map<number, D3Edge> = new Map();

  public nodes: D3Node[] = [];
  public edges: D3Edge[] = [];
  public groups: D3Group[] = [];

  public selectedNode?: D3Node;
  public selectedGroup?: D3Group;

  public update(nodes: Node[], edges: Edge[], clusters: Group[]): void {
    const oldNodesById = this.nodesById;
    const oldEdgesById = this.edgesById;
    this.nodesById = new Map(nodes.map(node => [node.id, oldNodesById.get(node.id) || new D3Node(node)]));
    this.edgesById = new Map(edges.map(edge => [
      edge.id,
      oldEdgesById.get(edge.id) ||
      new D3Edge(edge, this.nodesById.get(edge.sourceId)!, this.nodesById.get(edge.targetId)!)
    ]));
    this.nodes = Array.from(this.nodesById.values());
    this.edges = Array.from(this.edgesById.values());

    this.groups = [];
    for (const cluster of clusters) {
      const nodes = cluster.nodeIds.map(id => this.nodesById.get(id)).filter(node => node !== undefined) as D3Node[];
      if (nodes.length === 0) continue;

      const d3Cluster = new D3Group(cluster, nodes);
      for (const node of nodes) {
        node.group = d3Cluster;
      }
      if (d3Cluster.nodes.length > 0) {
        this.groups.push(d3Cluster);
      }
    }
  }
}

export interface Node {
  id: number;
  name: string;
  color: string;
  timestamp?: Date;
}

export interface Edge {
  id: number;
  sourceId: number;
  targetId: number;
  similarity: number;
}

export class D3Node implements Node {
  id: number;
  name: string;
  x = NaN;
  y = NaN;
  vx = NaN;
  vy = NaN;
  group?: D3Group;
  neighbors: D3Node[] = [];
  edges: D3Edge[]= [];
  color: string;
  timestamp?: Date;

  constructor(node: Node) {
    this.id = node.id;
    this.name = node.name;
    this.color = node.color;
    this.timestamp = node.timestamp;
  }
}

export class D3Edge implements Edge {
  id: number;
  sourceId: number;
  targetId: number;
  directed: boolean;
  source: D3Node;
  target: D3Node;
  similarity: number;
  width: number;

  constructor(edge: Edge, one: D3Node, other: D3Node) {
    this.id = edge.id;
    this.sourceId = edge.sourceId;
    this.targetId = edge.targetId;
    this.directed = !!(one.timestamp && other.timestamp);

    if (this.directed && one.timestamp! < other.timestamp!) {
      this.source = one;
      this.target = other;
    } else {
      this.source = other;
      this.target = one;
    }

    this.similarity = edge.similarity;
    this.width = 4 * Math.pow(Math.max(0.4, (edge.similarity - 0.75) / 0.2), 2);
  }
}


export interface Group {
  id: number;
  nodeIds: number[];
}

export class D3Group implements Group {
  id: number;
  nodeIds: number[] = [];
  nodes: D3Node[] = [];
  hull: [number, number][] = [];
  color: string;

  constructor(cluster: Group, nodes: D3Node[]) {
    this.id = cluster.id;
    this.nodeIds = cluster.nodeIds;
    this.nodes = nodes;

    const colors = new Map<string, number>();
    let maxCount = 0;
    this.color = nodes[0].color;
    for (const node of nodes) {
      const count = (colors.get(node.color) || 0) + 1;
      colors.set(node.color, count);
      if (count > maxCount) {
        this.color = node.color;
        maxCount = count;
      }
    }
  }
}
