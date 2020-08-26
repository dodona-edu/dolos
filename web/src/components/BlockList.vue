<template>
  <v-card>
    <v-card-title>
      Blocks
      <v-spacer></v-spacer>
      <slot></slot>
    </v-card-title>
    <v-container>
      <v-list class="overflow-y-auto" dense>
        <v-list-item-group color="primary" v-model="selectedItem">
          <BlockVisualizer
            :block="block"
            :id="'block-list-item-' + i" :key="i"
            :name="i+1"
            :subtext="false"
            @change="onBlockVisualizerChange"
            v-for="(block, i) in diff.blocks"
          >
          </BlockVisualizer>
        </v-list-item-group>
      </v-list>
    </v-container>
  </v-card>
</template>

<script lang="ts">
import { constructID } from "@/util/OccurenceHighlight";
import { Component, Watch } from "vue-property-decorator";
import BlockVisualizer from "@/components/BlockVisualizer.vue";
import BlockListBase from "@/components/BlockListBase.vue";
import { Block } from "@/api/api";

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

  onBlockVisualizerChange(newValue: boolean): void {
    if (!newValue) {
      this.selectedItem = -1;
    }
  }

  mounted(): void {
    super.mounted();
  }
}
</script>

<style scoped>

</style>
