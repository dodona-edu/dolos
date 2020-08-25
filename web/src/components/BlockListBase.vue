
<script lang="ts">
import { Prop, PropSync, Vue, Watch } from "vue-property-decorator";
import { Block, Diff } from "@/api/api";
import { SideID } from "@/components/CompareCard.vue";
import { constructID, SelectionId } from "@/util/OccurenceHighlight";

export default abstract class BlockListBase extends Vue {
  @Prop({ required: true }) diff!: Diff;
  @Prop({ required: true }) selected!: {
    side: SideID;
    blockClasses: Array<SelectionId>;
  };

  @PropSync("temp") selectedItem!: number;

  selectionsIds!: Array<[SelectionId, SelectionId]>;

  get selectedBlock(): Block | undefined {
    return this.diff.blocks![this.selectedItem];
  }

  mounted(): void {
    this.selectionsIds = this.diff.blocks!.map(block => {
      return [constructID(block.left), constructID(block.right)];
    });
  }

  changeSelectedItem(dx: number): void {
    const length = this.diff.blocks!.length;
    this.selectedItem = (((this.selectedItem + dx) % length) + length) % length;
  }

  @Watch("selected", { deep: true })
  onSelectedChange({ sides }: any): void {
    const { leftSideId, rightSideId } = sides;
    const leftSel = leftSideId.blockClasses[0];
    const rightSel = rightSideId.blockClasses[0];
    this.selectedItem = this.selectionsIds
      .findIndex(([left, right]) => (leftSel === left && rightSel === right));
  }

  @Watch("selectedItem")
  onSelectedItemChange(newVal: number): void {
    // this method must be present, otherwise errors might be thrown in watchers of components that extend this class
  }
}
</script>

<style scoped>

</style>
