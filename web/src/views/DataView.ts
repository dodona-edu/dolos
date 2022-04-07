import { Pair, ObjMap, Metadata, File } from "@/api/api";
import { Vue } from "vue-property-decorator";
import { singleLinkageCluster } from "@/util/clustering-algorithms/SingleLinkageClustering";
import { Clustering } from "@/util/clustering-algorithms/ClusterTypes";

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
    this.$store.commit("updateCutoff", value);
  }

  get clustering(): Clustering {
    return singleLinkageCluster(this.pairs, this.files, this.cutoff);
  }
}
