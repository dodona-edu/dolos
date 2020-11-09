import { Diff, ObjMap } from "@/api/api";
import { Vue } from "vue-property-decorator";

export default abstract class DataView extends Vue {
  async ensureData(): Promise<void> {
    if (!this.$store.state.dataLoaded) {
      await this.$store.dispatch("loadData");
    }
  }

  get diffs(): ObjMap<Diff> {
    return this.$store.state.data.diffs;
  }

  get files(): ObjMap<Diff> {
    return this.$store.state.data.files;
  }

  get dataLoaded(): boolean {
    return this.$store.state.dataLoaded;
  }
}
