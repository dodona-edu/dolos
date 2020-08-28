<template>
  <div style="height: 100%">
    <v-row no-gutters>
      <v-col>
        <v-container>
          <v-row>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title class="title">
                  Blocks
                </v-list-item-title>
              </v-list-item-content>
              <v-spacer></v-spacer>
              <slot name="header"></slot>
            </v-list-item>
          </v-row>
          <v-row>
            <v-col>
              <v-row no-gutters class="flex-nowrap" justify="space-between">
                <v-col cols="auto">
                  <v-btn ref="buttonleft1" @click.stop="changeSelectedItem(-1)">
                    <v-icon>
                      mdi-arrow-left-thick
                    </v-icon>
                  </v-btn>
                </v-col>
                <v-col cols="auto">
                  <BlockVisualizer class="no-y-padding" v-if="selectedBlock" :block="selectedBlock"></BlockVisualizer>
                  <!-- this second blockVisualizer makes sure that this component does not resize whenever a -->
                  <!-- block is selected/deselected -->
                  <BlockVisualizer class="no-y-padding" v-else :dummy="true" :block="diff.blocks[0]">
                  </BlockVisualizer>
                </v-col>
                <v-col cols="auto">
                  <v-btn ref="buttonright1" @click.stop="changeSelectedItem(1)">
                    <v-icon>
                      mdi-arrow-right-thick
                    </v-icon>
                  </v-btn>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
          <v-row>
            <slot name="actions"></slot>
          </v-row>
        </v-container>
      </v-col>
    </v-row>
    <v-divider></v-divider>
    <v-row no-gutters>
        <v-data-table
        id="blockList"
        style="width: 100%"
        height="100%"
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
        </v-row>
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
      const blockWithId = (block as BlockWithId);
      blockWithId.id = index;
      return blockWithId;
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
