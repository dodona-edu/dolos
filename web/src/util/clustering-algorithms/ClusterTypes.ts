import { Pair } from "@/api/api";
import { ListMap } from "../ListMap";

export type Edge = Pair;

export type Cluster = Set<Pair>;

export type Clustering = Cluster[];
export type ClusteringGraph = ListMap<number, Edge>;
