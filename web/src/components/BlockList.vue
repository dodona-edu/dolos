<template>
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
      <v-list class="overflow-y-auto" dense height="20vw">
        <v-list-item-group color="primary" v-model="selectedItem">
          <BlockVisualizer
            :block="block"
            :id="'block-list-item-' + i" :key="i"
            :name="i+1"
            :subtext="false"
            v-for="(block, i) in diff.blocks"
          >
          </BlockVisualizer>
        </v-list-item-group>
      </v-list>
    </v-card-text>
    <v-divider></v-divider>
    <v-card-actions>
      <v-btn @click.stop="changeSelectedItem(-1)" ref="buttonleft2">Previous</v-btn>
      <v-btn @click.stop="changeSelectedItem(1)" ref="buttonright2">Next</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { constructID, SelectionId } from "@/util/OccurenceHighlight";
import { Block, Diff } from "@/api/api";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { SideID } from "@/components/CompareCard.vue";
import BlockVisualizer from "@/components/BlockVisualizer.vue";
import BlockListBase from "@/components/BlockListBase.vue";

@Component({
  components: { BlockVisualizer },
  methods: {
    constructID
  }
})
export default class BlockList extends BlockListBase {
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
