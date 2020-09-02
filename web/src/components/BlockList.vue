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
              <v-row class="flex-nowrap" justify="space-between" no-gutters>
                <v-col cols="auto">
                  <v-btn @click.stop="changeSelectedItem(-1)" ref="buttonleft1">
                    <v-icon>
                      mdi-arrow-left-thick
                    </v-icon>
                  </v-btn>
                </v-col>
                <v-col cols="auto">
                  <BlockVisualizer
                    v-if="selectedBlock"
                    @change="onSelectedItemActiveChange"
                    :block="selectedBlock"
                    class="no-y-padding"
                  >
                  </BlockVisualizer>
                  <!-- this second blockVisualizer makes sure that this component does not resize whenever a -->
                  <!-- block is selected/deselected -->
                  <BlockVisualizer
                    v-else
                    :block="diff.blocks[0]"
                    :dummy="true"
                    class="no-y-padding"
                  >
                  </BlockVisualizer>
                </v-col>
                <v-col cols="auto">
                  <v-btn @click.stop="changeSelectedItem(1)" ref="buttonright1">
                    <v-icon>
                      mdi-arrow-right-thick
                    </v-icon>
                  </v-btn>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
          <v-row>
            <v-container class="no-y-padding" fluid>
              <v-row>
                <v-col class="no-y-padding" cols="12">
                  <v-list-item-subtitle>
                    Minimum block length
                  </v-list-item-subtitle>
                  <v-slider
                    :max="maxBlockKmers + 1"
                    :min="minBlockKmers"
                    @end="applyMinBlockLength"
                    thumb-label
                    track-color="lightgray"
                  >
                  </v-slider>
                </v-col>
              </v-row>
            </v-container>
          </v-row>
        </v-container>
      </v-col>
    </v-row>
    <v-divider></v-divider>
    <v-row no-gutters>
      <v-data-table
        :headers="headers"
        :item-class="itemClassFunction"
        :items="blocksWithId"
        @click:row="onRowClick"
        disable-pagination
        fixed-header
        height="71vh"
        hide-default-footer
        id="blockList"
        item-key="id"
        multi-sort
        selectable-key="active"
        single-select
        style="width: 100%"
        v-model="dataTableSelection"
      >
        <template v-slot:item.active="{ item }">
          <v-simple-checkbox
            :ripple="false"
            @input="dataTableCheckBoxToggle(item, $event)"
            color="primary"
            off-icon="mdi-eye-off"
            on-icon="mdi-eye"
            v-model="item.active"
          ></v-simple-checkbox>
        </template>
      </v-data-table>
    </v-row>
  </div>
</template>

<script lang="ts">
import BlockVisualizer from "@/components/BlockVisualizer.vue";
import { Block, Diff } from "@/api/api";
import { Component, Prop, PropSync, Vue, Watch } from "vue-property-decorator";
import { constructID, SelectionId } from "@/util/OccurenceHighlight";
import { SideID } from "@/components/CompareCard.vue";

interface BlockWithId extends Block {
  id: number;
}

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

  @PropSync("selectedItemSync", { required: true }) selectedItem!: number;

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

  selectionsIds!: Array<[SelectionId, SelectionId]>;
  dataTableSelection: [BlockWithId] | [] = [];

  get blockLengths(): Array<number> {
    return this.diff.blocks?.map(block => block.pairs.length)!;
  }

  get minBlockKmers(): number {
    return this.blockLengths.reduce((pv, cv) => Math.min(pv, cv)) as number;
  }

  get maxBlockKmers(): number {
    return this.blockLengths.reduce((pv, cv) => Math.max(pv, cv)) as number;
  }

  get selectedBlock(): Block | undefined {
    if (this.diff.blocks === null) {
      return undefined;
    } else {
      return this.diff.blocks[this.selectedItem];
    }
  }

  get anyActive(): boolean {
    if (this.diff.blocks === null) {
      return false;
    } else {
      return this.diff.blocks.some(block => block.active) as boolean;
    }
  }

  get blocksWithId(): Array<BlockWithId> {
    if (this.diff.blocks === null) {
      return [];
    } else {
      return this.diff.blocks.map((block, index) => {
        const blockWithId = (block as BlockWithId);
        blockWithId.id = index;
        return blockWithId;
      });
    }
  }

  applyMinBlockLength(value: number): void {
    if (this.diff.blocks !== null) {
      for (const block of this.diff.blocks) {
        block.active = value <= block.pairs.length;
      }
      if (this.selectedBlock && !this.selectedBlock.active) {
        this.selectedItem = -1;
      }
    }
  }

  changeSelectedItem(dx: number, current?: number): void {
    if (this.diff.blocks === null || !this.anyActive) {
      this.selectedItem = -1;
    } else {
      const length = this.diff.blocks.length;
      // explicit undefined check because 0 is falsy
      let value = current === undefined ? this.selectedItem : current;
      while (value < 0) {
        value += length;
      }
      const next = (((value + dx) % length) + length) % length;
      if (!this.diff.blocks[next].active) {
        this.changeSelectedItem(dx, next);
      } else {
        this.selectedItem = next;
      }
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

  handleKeyboardEvent(event: KeyboardEvent): void {
    event.preventDefault();
    if (event.key === "ArrowLeft") {
      this.changeSelectedItem(-1);
    } else if (event.key === "ArrowRight") {
      this.changeSelectedItem(1);
    } else if (event.key === " " || event.key === "Enter") {
      if (this.selectedBlock) {
        this.selectedBlock.active = !this.selectedBlock.active;
      }
    }
  }

  destroyed(): void {
    window.removeEventListener("keyup", this.handleKeyboardEvent);
  }

  created(): void {
    window.addEventListener("keyup", this.handleKeyboardEvent);
  }

  mounted(): void {
    if (this.diff.blocks === null) {
      const unwatch = this.$watch("diff.blocks", function () {
        // the documentation specifically tells that arrow function should not be used
        // eslint-disable-next-line no-invalid-this
        this.makeSelectionsWithIds();
        // eslint-disable-next-line no-invalid-this
        if (this.selectionsIds.length > 0) {
          unwatch();
        }
      });
    } else {
      this.makeSelectionsWithIds();
    }
  }

  private makeSelectionsWithIds(): void {
    if (this.diff.blocks === null) {
      this.selectionsIds = [];
    } else {
      this.selectionsIds = this.diff.blocks.map(block => {
        return [constructID(block.left), constructID(block.right)];
      });
    }
  }

  itemClassFunction(block: BlockWithId): string | void {
    if (this.selectedItem === block.id) {
      return "blue lighten-4";
    }
  }

  dataTableCheckBoxToggle(block: BlockWithId, value: boolean): void {
    if (this.selectedItem === block.id && !value) {
      this.selectedItem = -1;
    }
  }

  onSelectedItemActiveChange(value: boolean): void {
    if (!value) {
      this.selectedItem = -1;
    }
  }

  onRowClick(block: BlockWithId, { isSelected, select }: { isSelected: boolean; select: (value: boolean) => void }):
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
      this.dataTableSelection = [];
    } else {
      this.dataTableSelection = [this.blocksWithId[newVal]];
    }
  }
}
</script>

<style>

/* fixes wrong display of data table header */
.v-navigation-drawer__border {
  z-index: 2;
}

</style>
