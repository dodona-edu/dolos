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
                  <BlockVisualizer
                    class="no-y-padding"
                    v-if="selectedBlock"
                    :block="selectedBlock">
                  </BlockVisualizer>
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
            <v-container fluid class="no-y-padding">
              <v-row>
                <v-col cols="12" class="no-y-padding">
                  <v-list-item-subtitle>
                    Minimum block length
                  </v-list-item-subtitle>
                  <v-slider
                    class="slider-min-width"
                    @end="applyMinBlockLength"
                    thumb-label
                    track-color="lightgray"
                    :min="lowestBlockLength"
                    :max="highestBlockLength + 1"
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
import BlockVisualizer from "@/components/BlockVisualizer.vue";
import { Block, Diff } from "@/api/api";
import { Prop, PropSync, Vue, Watch, Component } from "vue-property-decorator";
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

  @PropSync("temp", { required: true }) selectedItem!: number;

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

  applyMinBlockLength(value: number): void {
    for (const block of this.diff.blocks!) {
      block.active = value <= block.pairs.length;
    }
    if (this.selectedBlock && !this.selectedBlock.active) {
      this.selectedItem = -1;
    }
  }

  get blockLengths(): Array<number> {
    return this.diff.blocks?.map(block => block.pairs.length)!;
  }

  get lowestBlockLength(): number {
    return this.blockLengths.reduce((pv, cv) => Math.min(pv, cv)) as number;
  }

  get highestBlockLength(): number {
    return this.blockLengths.reduce((pv, cv) => Math.max(pv, cv)) as number;
  }

  get selectedBlock(): Block | undefined {
    return this.diff.blocks![this.selectedItem];
  }

  get anyActive(): boolean {
    return this.diff.blocks?.some(block => block.active) as boolean;
  }

  changeSelectedItem(dx: number, current?: number): void {
    if (!this.anyActive) {
      this.selectedItem = -1;
    } else {
      const length = this.diff.blocks!.length;
      // explicit undefined check because 0 is falsy
      let value = current === undefined ? this.selectedItem : current;
      while (value < 0) {
        value += length;
      }
      const next = (((value + dx) % length) + length) % length;
      if (!this.diff.blocks![next].active) {
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

  // TODO rename this
  tempSel: Array<BlockWithId> = [];

  mounted(): void {
    this.selectionsIds = this.diff.blocks!.map(block => {
      return [constructID(block.left), constructID(block.right)];
    });
  }

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
      this.tempSel = [];
    } else {
      this.tempSel = [this.blocksWithId[newVal]];
    }
    // const el = document.querySelector("#blockList .v-data-table__selected");
    // if (el) {
    //   el.scrollIntoView({ behavior: "smooth", block: "center" });
    // }
  }
}
</script>

<style>

.v-navigation-drawer__border {
  z-index: 2;
}

</style>
