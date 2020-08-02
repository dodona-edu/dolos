import { Intersection, ObjMap } from "@/api/api";
import { Vue } from "vue-property-decorator";

export default abstract class DataView extends Vue {
  async ensureData(): Promise<void> {
    if (!this.$store.state.dataLoaded) {
      await this.$store.dispatch("loadData");
    }
  }

  get intersections(): ObjMap<Intersection> {
    return this.$store.state.data.intersections;
  }

  get dataLoaded(): boolean {
    return this.$store.state.dataLoaded;
  }
}
