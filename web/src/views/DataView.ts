import { Pair, ObjMap, Metadata, File } from "@/api/api";
import { Vue } from "vue-property-decorator";
import { singleLinkageCluster } from "@/util/clustering-algorithms/SingleLinkageClustering";
import { Clustering } from "@/util/clustering-algorithms/ClusterTypes";
import * as d3 from "d3";

export type Legend = {[key: string]: { label: string; selected: boolean; color: string }};

export default abstract class DataView extends Vue {
  async ensureData(): Promise<void> {
    if (!this.$store.state.api.isLoaded) {
      await this.$store.dispatch("loadData");
    }
  }

  get metadata(): Metadata {
    return this.$store.state.api.metadata;
  }

  get pairs(): ObjMap<Pair> {
    return this.$store.state.api.pairs;
  }

  get files(): ObjMap<File> {
    return this.$store.state.api.files;
  }

  get dataLoaded(): boolean {
    return this.$store.state.api.isLoaded;
  }

  get cutoff(): number {
    return this.$store.state.api.cutoff;
  }

  set cutoff(value:number) {
    this.$store.commit("updateCutoff", +value);
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
      .scaleOrdinal(d3.schemeCategory10.filter(c => c !== "#7f7f7f"))
      .domain([...labels].reverse());
    const legend = [...labels].sort().map(p => ({
      label: p,
      selected: true,
      color: colorScale(p),
    }));

    return Object.fromEntries(legend.map(l => [l.label, l]));
  }
}
