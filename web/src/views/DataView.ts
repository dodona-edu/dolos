import { Pair, ObjMap, Metadata } from "@/api/api";
import { Vue } from "vue-property-decorator";

export default abstract class DataView extends Vue {
  async ensureData(): Promise<void> {
    if (!this.$store.state.dataLoaded) {
      await this.$store.dispatch("loadData");
    }
  }

  get metadata(): Metadata {
    return this.$store.state.data.metadata;
  }

  get pairs(): ObjMap<Pair> {
    return this.$store.state.data.pairs;
  }

  get files(): ObjMap<File> {
    return this.$store.state.data.files;
  }

  get dataLoaded(): boolean {
    return this.$store.state.dataLoaded;
  }
}
