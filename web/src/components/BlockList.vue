<template>
  <v-card>
    <v-card-title>
      Blocks
    </v-card-title>
    <v-container>
      <v-list class="overflow-y-auto" dense style="height: calc(65vh)">
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
    </v-container>
  </v-card>
</template>

<script lang="ts">
import { constructID } from "@/util/OccurenceHighlight";
import { Component, Watch } from "vue-property-decorator";
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

  mounted(): void {
    super.mounted();
  }
}
</script>

<style scoped>

</style>
