import { Pair, ObjMap, Metadata, File } from "@/api/models";
import { Vue } from "vue-property-decorator";
import { singleLinkageCluster } from "@/util/clustering-algorithms/SingleLinkageClustering";
import { Clustering } from "@/util/clustering-algorithms/ClusterTypes";
import * as d3 from "d3";

export type Legend = {
  [key: string]: { label: string; selected: boolean; color: string };
};

export default abstract class DataView extends Vue {
  async ensureData(): Promise<void> {
    // Temporary hack to ensure data is loaded.
    // This will be removed together with this class,
    // once all components are migrated to the Composition API.
    await new Promise(resolve => {
      const interval = setInterval(() => {
        if (this.$pinia.state.value.api.isLoaded) {
          clearInterval(interval);
          resolve(null);
        }
      }, 50);
    });
  }

  get metadata(): Metadata {
    return this.$pinia.state.value.metadata?.metadata ?? {};
  }

  get pairs(): ObjMap<Pair> {
    return this.$pinia.state.value.pairs?.pairs ?? {};
  }

  get files(): ObjMap<File> {
    return this.$pinia.state.value.files?.files ?? {};
  }

  get dataLoaded(): boolean {
    return this.$pinia.state.value.api.isLoaded ?? {};
  }

  get cutoff(): number {
    return this.$pinia.state.value.api.cutoff;
  }

  set cutoff(value: number) {
    this.$pinia.state.value.api.cutoff = parseFloat(value as any);
  }

  get clustering(): Clustering {
    return singleLinkageCluster(this.pairs, this.files, this.cutoff);
  }

  createLegend(): Legend {
    const labels = new Set<string>();

    for (const file of Object.values(this.files)) {
      labels.add(file.extra.labels || "N/A");
    }

    const colorScale = d3
      .scaleOrdinal(d3.schemeCategory10.filter((c) => c !== "#7f7f7f"))
      .domain([...labels].reverse());
    const legend = [...labels].sort().map((p) => ({
      label: p,
      selected: true,
      color: colorScale(p),
    }));

    return Object.fromEntries(legend.map((l) => [l.label, l]));
  }

  get anonymous(): boolean {
    return this.$pinia.state.value.api.isAnonymous;
  }

  set anonymous(anonymous: boolean) {
    this.$pinia.state.value.api.isAnonymous = anonymous;
  }
}
