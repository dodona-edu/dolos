<template>
  <v-expansion-panels>
    <v-expansion-panel>
      <v-expansion-panel-header v-slot="{ open }">
        <v-fade-transition>
          <v-row v-if="!open" justify="start" align="center">
            <v-btn @click.stop="changeSelectedItem(-1)">Previous</v-btn>
            <v-btn @click.stop="changeSelectedItem(1)">Next</v-btn>
            <BlockVisualizer v-if="selectedBlock" :block="selectedBlock"></BlockVisualizer>
          </v-row>
        </v-fade-transition>
      </v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-card outlined>
          <v-card-title>
            Blocks
          </v-card-title>
          <v-card-text>
            <v-list dense>
              <v-list-item>
                <v-list-item-action>
                </v-list-item-action>
                <v-list-item-content>
                  <v-row>
                    <v-col cols="4">
                    </v-col>
                    <v-col cols="4">
                      Left
                    </v-col>
                    <v-col cols="4">
                      Right
                    </v-col>
                  </v-row>
                </v-list-item-content>
              </v-list-item>
            </v-list>
            <v-list dense height="20vw" class="overflow-y-auto">
              <v-list-item-group color="primary" v-model="selectedItem" @change="emitBlockClick()">
                <BlockVisualizer
                  v-for="(block, i) in diff.blocks"
                  :key="i" :id="'block-list-item-' + i"
                  :block="block"
                  :name="i+1"
                  :subtext="false"
                  >
                </BlockVisualizer>
              </v-list-item-group>
            </v-list>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions>
            <v-btn @click.stop="changeSelectedItem(-1)">Previous</v-btn>
            <v-btn @click.stop="changeSelectedItem(1)">Next</v-btn>
          </v-card-actions>
        </v-card>
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>

</template>

<script lang="ts">
import { constructID, SelectionId } from "@/util/OccurenceHighlight";
import { Block, Diff } from "@/api/api";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { SideID } from "@/components/CompareCard.vue";
import BlockVisualizer from "@/components/BlockVisualizer.vue";

@Component({
  components: { BlockVisualizer },
  methods: {
    constructID
  }
})
export default class BlockList extends Vue {
  @Prop({ required: true }) diff!: Diff;
  @Prop({ required: true }) selected!: {
    side: SideID;
    blockClasses: Array<SelectionId>;
  };

  get selectedBlock(): Block | undefined {
    return this.diff.blocks![this.selectedItem];
  }

  selectionsIds!: Array<[SelectionId, SelectionId]>;
  selectedItem = 0;

  mounted(): void {
    this.selectionsIds = this.diff.blocks!.map(block => {
      return [constructID(block.left), constructID(block.right)];
    });
  }

  emitBlockClick(): void {
    this.$emit("blockclick", this.selectionsIds[this.selectedItem]);
  }

  changeSelectedItem(dx: number): void {
    const length = this.diff.blocks!.length;
    this.selectedItem = (((this.selectedItem + dx) % length) + length) % length;
    this.emitBlockClick();
  }

  @Watch("selectedItem")
  onSelectedItemChange(newVal: number): void {
    const el = document.querySelector(`#block-list-item-${newVal}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  @Watch("selected", { deep: true })
  onSelectedChange({ sides }: any): void {
    const { leftSideId, rightSideId } = sides;
    const leftSel = leftSideId.blockClasses[0];
    const rightSel = rightSideId.blockClasses[0];
    this.selectedItem = this.selectionsIds
      .findIndex(([left, right]) => (leftSel === left && rightSel === right));
  }
}
</script>

<style scoped>

</style>
