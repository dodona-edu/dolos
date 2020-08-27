<template>
  <div style="height: 100%">
    <v-list-item>
      <v-list-item-content>
        <v-list-item-title class="title">
          Blocks
        </v-list-item-title>
      </v-list-item-content>
      <v-spacer></v-spacer>
      <slot></slot>
    </v-list-item>
      <v-data-table
        id="blockList"
        height="89vh"
        multi-sort
        fixed-header
        hide-default-footer
        disable-pagination
        :headers="headers"
        :items="diff.blocks"
      >

        <template v-slot:item.active="{ item }">

          <!--TODO get @change to work -->
          <v-simple-checkbox
            :ripple="false"
            color="primary"
            off-icon="mdi-eye-off"
            @change="onBlockVisualizerChange"
            on-icon="mdi-eye"
            v-model="item.active"
          ></v-simple-checkbox>
        </template>
      </v-data-table>
  </div>
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
  headers = [
    {
      text: "visibility",
      sortable: true,
      value: "active"
    },
    {
      text: "K-mers",
      sortable: true,
      value: "pairs.length"
    }
  ]

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

<style>

.v-navigation-drawer__border {
  z-index: 2;
}

</style>
