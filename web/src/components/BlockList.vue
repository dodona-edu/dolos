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
<!--    item-class -->
      <v-data-table
        id="blockList"
        height="89vh"
        multi-sort
        fixed-header
        hide-default-footer
        disable-pagination
        single-select
        :item-class="itemClassFunction"
        selectable-key="active"
        item-key="id"
        @click:row="onRowClick"
        v-model="tempSel"
        :headers="headers"
        :items="blocksWithId"
      >

        <template v-slot:item.active="{ item }">

          <!--TODO get @change to work -->
          <v-simple-checkbox
            :ripple="false"
            color="primary"
            off-icon="mdi-eye-off"
            on-icon="mdi-eye"
            @input="checkBoxToggle(item, $event)"
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
import { Block } from "@/api/api";

interface BlockWithId extends Block {
  id: number;
}

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

  tempSel: Array<BlockWithId> = [];

  itemClassFunction(block: BlockWithId): string | void {
    if (this.selectedItem === block.id) {
      return "blue lighten-4";
    }
  }

  get blocksWithId(): Array<BlockWithId> {
    return this.diff.blocks!.map((block, index) => {
      return { ...block, id: index };
    });
  }

  checkBoxToggle(block: BlockWithId, value: boolean): void {
    if (this.selectedItem === block.id && !value) {
      this.selectedItem = -1;
    }
  }

  onRowClick(block: BlockWithId, { isSelected, select }: { isSelected: boolean; select: (value: boolean) => void}):
    void {
    if (block.active) {
      select(!isSelected);
      if (isSelected) {
        this.selectedItem = -1;
      } else {
        this.selectedItem = block.id;
      }
    }
  }

  @Watch("selectedItem")
  onSelectedItemChange(newVal: number): void {
    if (newVal === -1) {
      this.tempSel = [];
    } else {
      this.tempSel = [this.blocksWithId[newVal]];
    }
    // const el = document.querySelector("#blockList .v-data-table__selected");
    // if (el) {
    //   el.scrollIntoView({ behavior: "smooth", block: "center" });
    // }
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
