import { Pair, ObjMap, Metadata, File } from "@/api/api";
import { Vue } from "vue-property-decorator";
import { Occurrence } from "@dodona/dolos-lib";

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

  get occurrences(): Occurrence[][] {
    return this.$store.state.api.occurrences;
  }

  get dataLoaded(): boolean {
    return this.$store.state.api.isLoaded;
  }
}
