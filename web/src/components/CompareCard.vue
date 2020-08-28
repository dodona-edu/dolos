<template>
  <v-container fluid class="no-y-padding">
    <v-row>
      <v-col>
        <v-row dense class="no-y-padding">
          <v-col cols="12" class="no-y-padding">
            <v-row no-gutters>
              <v-col cols="12" class="no-y-padding">
                <v-card :loading="!loaded">
                  <v-card-title>
                    {{ leftFilename }}
                    <v-spacer/>
                    {{ rightFilename }}
                  </v-card-title>
                  <v-container fluid>
                    <v-row justify="center" no-gutters v-if="loaded">
                      <v-col md="6" sm="12">
                        <v-row class="flex-nowrap" no-gutters>
                          <v-col cols="11">
                            <compare-side
                              :active-selections="leftActiveSelectionIds"
                              :file="diff.leftFile"
                              :hovering-selections="lastHovered.leftSideId.blockClasses"
                              :identifier="SideID.leftSideId"
                              :selected-selections="selected.sides.leftSideId.blockClasses"
                              :selections="leftSelections"
                              @codescroll="onScrollHandler"
                              @linesvisibleamount="setLinesVisible"
                              @selectionclick="selectionClickEventHandler"
                              @selectionhoverenter="onHoverEnterHandler"
                              @selectionhoverexit="onHoverExitHandler"
                              ref="leftCompareSide"
                            >
                            </compare-side>
                          </v-col>
                          <v-col cols="auto">
                            <BarcodeChart
                              :active-selections="leftActiveSelectionIds"
                              :amount-of-lines-visible="linesVisible"
                              :document-scroll-fraction="leftScrollFraction"
                              :hovering-selections="lastHovered.leftSideId.blockClasses"
                              :lines="leftLines"
                              :maxLines="maxLines"
                              :selected-selections="selected.sides.leftSideId.blockClasses"
                              :selections="leftSelections"
                              :side-identifier="SideID.leftSideId"
                              @selectionclick="selectionClickEventHandler"
                              @selectionhoverenter="onHoverEnterHandler"
                              @selectionhoverexit="onHoverExitHandler"
                            ></BarcodeChart>
                          </v-col>
                        </v-row>
                      </v-col>
                      <v-col md="6" sm="12">
                        <v-row class="flex-nowrap" no-gutters>
                          <v-col cols="11">
                            <compare-side
                              :active-selections="rightActiveSelectionIds"
                              :file="diff.rightFile"
                              :hovering-selections="lastHovered.rightSideId.blockClasses"
                              :identifier="SideID.rightSideId"
                              :selected-selections="selected.sides.rightSideId.blockClasses"
                              :selections="rightSelections"
                              @codescroll="onScrollHandler"
                              @selectionclick="selectionClickEventHandler"
                              @selectionhoverenter="onHoverEnterHandler"
                              @selectionhoverexit="onHoverExitHandler"
                            >
                            </compare-side>
                          </v-col>
                          <v-col cols="auto">
                            <BarcodeChart
                              :active-selections="rightActiveSelectionIds"
                              :amount-of-lines-visible="linesVisible"
                              :document-scroll-fraction="rightScrollFraction"
                              :hovering-selections="lastHovered.rightSideId.blockClasses"
                              :lines="rightLines"
                              :maxLines="maxLines"
                              :selected-selections="selected.sides.rightSideId.blockClasses"
                              :selections="rightSelections"
                              :side-identifier="SideID.rightSideId"
                              @selectionclick="selectionClickEventHandler"
                              @selectionhoverenter="onHoverEnterHandler"
                              @selectionhoverexit="onHoverExitHandler"
                            ></BarcodeChart>
                          </v-col>
                        </v-row>
                      </v-col>
                    </v-row>
                  </v-container>
                </v-card>
              </v-col>
            </v-row>
            <v-row dense class="no-y-padding">
              <v-col cols="12" class="no-y-padding">
                <v-card>
                  <v-container fluid class="no-y-padding">
                    <BlockNavigation
                      :diff="diff"
                      :selected="selected"
                      :temp.sync="selectedItem"
                    >
                      <v-col sm="7" xs="10" md="6">
                      </v-col>
                    </BlockNavigation>
                  </v-container>
                </v-card>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="auto" v-if="!blockListExtended">
        <v-row>
          <v-btn icon @click="blockListExtended = !blockListExtended">
            <v-icon>
              <!-- For some strange reason "mdi-application-cog" and other cog variants wont work out of the box -->
              {{mdiApplicationCog}}
            </v-icon>
          </v-btn>
        </v-row>
        <v-row>
          <v-menu @click.stop="" direction="top" transition="scale" offset-y open-on-hover>
            <template v-slot:activator="{ on, attrs }">
              <v-btn v-on="on" v-bind="attrs" @click.stop="" small fab icon>
                <v-icon dark>mdi-help</v-icon>
              </v-btn>
            </template>
            <v-card>
              <v-card-title>
                Keyboard shortcuts
              </v-card-title>
              <v-card-text>
                <v-list-item :dense="true" v-for="(item, i)  in shortcutsHelptext" :key="i">
                  {{ item[0] }}: {{ item[1] }}
                </v-list-item>
              </v-card-text>
            </v-card>
          </v-menu>
        </v-row>
      </v-col>
    </v-row>
    <v-navigation-drawer clipped app :value="blockListExtended" right>
      <BlockList
        v-if="blockListExtended"
        :diff="diff"
        :selected="selected"
        :temp.sync="selectedItem"
      >
        <template v-slot:header>
          <v-btn small icon @click="blockListExtended = false">
            <v-icon>
              mdi-close
            </v-icon>
          </v-btn>
        </template>
        <template v-slot:actions>
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
<!--            <v-row>-->
<!--              <v-col>-->
<!--                <v-list-item-subtitle>Minimum block length-->
<!--                </v-list-item-subtitle>-->
<!--              </v-col>-->
<!--&lt;!&ndash;              <v-subheader>Minimum block lenght</v-subheader>&ndash;&gt;-->
<!--            </v-row>-->
<!--            <v-row no-gutters>-->
<!--              <v-col>-->
<!--              </v-col>-->
<!--            </v-row>-->
          </v-container>
        </template>
      </BlockList>
    </v-navigation-drawer>
  </v-container>
</template>
<script lang="ts">

import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import { Block, Diff, Selection } from "@/api/api";
import CompareSide from "@/components/CompareSide.vue";
import BarcodeChart from "@/components/BarcodeChart.vue";
import { constructID, SelectionId } from "@/util/OccurenceHighlight";
import * as d3 from "d3";
import BlockList from "@/components/BlockList.vue";
import BlockNavigation from "@/components/BlockNavigation.vue";
import { mdiApplicationCog } from "@mdi/js";

export enum SideID {
  leftSideId = "leftSideId",
  rightSideId = "rightSideId"
}

@Component({
  data: () => ({ SideID, mdiApplicationCog }),
  components: { BlockNavigation, CompareSide, BarcodeChart, BlockList },
})
export default class Compare extends Vue {
  @Prop({ default: false, required: true }) loaded!: boolean;
  @Prop({ required: true }) diff!: Diff;

  shortcutsHelptext = [
    ["Left Arrow", "Previous"],
    ["Right Arrow", "Next"],
    ["Space/Enter", "Toggle selection"],
  ]

  applyMinBlockLength(value: number): void {
    for (const block of this.diff.blocks!) {
      block.active = value <= block.pairs.length;
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

  blockListExtended = true;

  selectedItem = -1;

  blockClickCount = 0;
  currentBlockClassIndex = 0;
  // this maps a selected id to all the other selected-ids that it corresponds with
  leftMap!: Map<SelectionId, Array<SelectionId>>;
  rightMap!: Map<SelectionId, Array<SelectionId>>;
  // maps an id of a side to its map
  sideMap!: Map<SideID, Map<SelectionId, Array<SelectionId>>>;

  sideSelectionsToBlocks: {
    [key in SideID]: {
      [key: string]: Block[];
    }
  } = {
    [SideID.leftSideId]: {},
    [SideID.rightSideId]: {},
  }

  selected: {
    sides: {
      [key in SideID]: {
        blockClasses: Array<SelectionId>;
      };
    };
    side?: string;
    blockClasses?: Array<SelectionId>;
  } = {
    sides: {
      [SideID.leftSideId]: { blockClasses: [] },
      [SideID.rightSideId]: { blockClasses: [] },
    }
  };

  lastHovered: {
    [key in SideID]: {
      blockClasses: Array<SelectionId>;
    };
  } = {
    [SideID.leftSideId]: { blockClasses: [] },
    [SideID.rightSideId]: { blockClasses: [] },
  };

  leftScrollFraction = 0;
  rightScrollFraction = 0;
  linesVisible = 0;

  get leftIdentifier(): string {
    return SideID.leftSideId.toString();
  }

  get leftLines(): number {
    return this.trimLastEmptyLine(this.diff.leftFile.content.split("\n"));
  }

  get rightLines(): number {
    return this.trimLastEmptyLine(this.diff.rightFile.content.split("\n"));
  }

  get maxLines(): number {
    return Math.max(
      this.leftLines,
      this.rightLines
    );
  }

  get rightFilename(): string {
    return this.diff.rightFile.path;
  }

  get leftFilename(): string {
    return this.diff.leftFile.path;
  }

  get activeBlocks(): Array<Block> {
    return this.diff.blocks!
      .filter(block => block.active);
  }

  get leftActiveSelectionIds(): Array<SelectionId> {
    return this.activeBlocks.map(block => constructID(block.left));
  }

  get rightActiveSelectionIds(): Array<SelectionId> {
    return this.activeBlocks.map(block => constructID(block.right));
  }

  get leftSelections(): Array<Selection> {
    return this.diff.blocks!.map(block => block.left);
  }

  get rightSelections(): Array<Selection> {
    return this.diff.blocks!.map(block => block.right);
  }

  isSelectionActive(sideId: SideID): (selectionId: SelectionId) => boolean {
    return selectionId => this.sideSelectionsToBlocks[sideId][selectionId].some(block => block.active);
  }

  onScrollHandler(sideId: SideID, scrollFraction: number): void {
    if (sideId === SideID.rightSideId) {
      this.rightScrollFraction = scrollFraction;
    } else {
      this.leftScrollFraction = scrollFraction;
    }
  }

  setLinesVisible(lines: number): void {
    this.linesVisible = lines;
  }

  /**
   * Prismjs trims the last line of code if that line is empty so we have to take that into account.
   */
  trimLastEmptyLine(lines: Array<string>): number {
    if (lines[lines.length - 1].length === 0) {
      return lines.length - 1;
    } else {
      return lines.length;
    }
  }

  updated(): void {
    this.initialize();
  }

  initialize(): void {
    this.leftMap = new Map();
    this.rightMap = new Map();
    this.sideMap = new Map([
      [SideID.rightSideId, this.rightMap],
      [SideID.leftSideId, this.leftMap]
    ]);
    this.initializeMaps();
  }

  getOtherSide(sideId: SideID): SideID {
    return sideId === SideID.rightSideId ? SideID.leftSideId : SideID.rightSideId;
  }

  getAllOtherBlockClasses(sideId: SideID, blockClasses: Array<string>): Array<string> {
    const map = this.sideMap.get(sideId)!;
    return blockClasses.flatMap(blockClass => map.get(blockClass)!);
  }

  onHoverEnterHandler(sideId: SideID, blockClasses: Array<string>): void {
    const filteredBlockClasses = blockClasses.filter(this.isSelectionActive(sideId));
    const otherSideId = this.getOtherSide(sideId);
    const otherBlockClasses = this.getAllOtherBlockClasses(sideId, filteredBlockClasses)
      .filter(this.isSelectionActive(otherSideId));

    this.lastHovered[sideId].blockClasses = filteredBlockClasses;
    this.lastHovered[otherSideId].blockClasses = otherBlockClasses;
  }

  onHoverExitHandler(sideId: SideID, blockClasses: Array<string>): void {
    const otherSideId = this.getOtherSide(sideId);
    this.lastHovered[sideId].blockClasses = [];
    this.lastHovered[otherSideId].blockClasses = [];
  }

  cycle(sideId: SideID, blockClasses: Array<string>): [string, string] {
    blockClasses.sort(this.sortSelectionId);
    // if the there is nothing that was last clicked, or a different block from last time is clicked initialize the
    // values
    if (this.selected.blockClasses === undefined || !(sideId === this.selected.side &&
      this.selected.blockClasses.toString() === blockClasses.toString())) {
      this.currentBlockClassIndex = 0;
      this.blockClickCount = 1;
      Vue.set(this.selected, "side", sideId);
      // this.selected.side = sideId;
      Vue.set(this.selected, "blockClasses", blockClasses.slice());
      // this.selected.blockClasses = blockClasses.slice();
    }

    const map = this.sideMap.get(sideId)!;
    let id = this.selected.blockClasses![this.currentBlockClassIndex];
    let blocks = map.get(id)!;
    // cycles through all the blocks on the other side and if all the blocks have been cycled through, go to the next
    // set of blocks
    if (this.blockClickCount === blocks.length) {
      this.blockClickCount = 1;
      this.currentBlockClassIndex = (this.currentBlockClassIndex + 1) % this.selected.blockClasses!.length;
      id = this.selected.blockClasses![this.currentBlockClassIndex];
      blocks = map.get(id)!;
    } else {
      this.blockClickCount += 1;
    }

    const other = blocks[this.blockClickCount - 1] as string;
    return [id, other];
  }

  makeSelector(sideId: SideID, blockClasses: Array<string>): string {
    return blockClasses
      .map(blockClass => `#${sideId} .${blockClass}`)
      .join(", ");
  }

  selectionClickEventHandler(sideId: SideID, blockClasses: Array<string>): void {
    if (blockClasses.length === 0) {
      Vue.set(this.selected.sides[SideID.leftSideId], "blockClasses", []);
      Vue.set(this.selected.sides[SideID.rightSideId], "blockClasses", []);
    } else {
      const [id, other] = this.cycle(sideId, blockClasses);

      Vue.set(this.selected.sides[sideId], "blockClasses", [id]);
      Vue.set(this.selected.sides[this.getOtherSide(sideId)], "blockClasses", [other]);

      this.scrollSelectedIntoView();
    }
  }

  scrollSelectedIntoView(): void {
    // for some reason scrolling will not always work when it is done in each CompareSide separately
    const element = d3.select(
      this.makeSelector(
        SideID.leftSideId,
        this.selected.sides[SideID.leftSideId].blockClasses
      )
    ).node();
    const otherElement = d3.select(
      this.makeSelector(
        SideID.rightSideId,
        this.selected.sides[SideID.rightSideId].blockClasses
      )
    ).node();
    (element as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center" });
    (otherElement as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center" });
  }

  @Watch("selectedItem")
  blockClickEventHandler(index: number | undefined): void {
    if (index === undefined || index === -1) {
      Vue.set(this.selected.sides[SideID.leftSideId], "blockClasses", []);
      Vue.set(this.selected.sides[SideID.rightSideId], "blockClasses", []);
    } else {
      const { left, right } = this.diff.blocks![index];
      Vue.set(this.selected.sides[SideID.leftSideId], "blockClasses", [constructID(left)]);
      Vue.set(this.selected.sides[SideID.rightSideId], "blockClasses", [constructID(right)]);
      this.scrollSelectedIntoView();
    }
  }

  extractRowCol(value: string): [number, number] {
    const [row, col] = value.split("-").slice(3, 5);
    return [+row, +col];
  }

  sortSelectionId(el1: string, el2: string): number {
    const [row1, col1] = this.extractRowCol(el1);
    const [row2, col2] = this.extractRowCol(el2);
    const res = row1 - row2;
    if (res === 0) {
      return col1 - col2;
    } else {
      return res;
    }
  }

  sortMap(map: Map<string, Array<string>>): void {
    for (const array of map.values()) {
      array.sort(this.sortSelectionId);
    }
  }

  /**
   * Initialized leftMap and rightMap. Either of these maps map a selection id to a list of corresponding selection ids
   * on the other CompareSide. This is done by looping over all the hunks in the current diff.
   */
  initializeMaps(): void {
    for (const block of this.diff.blocks!) {
      const leftId = constructID(block.left);
      const rightId = constructID(block.right);
      if (!this.sideSelectionsToBlocks[SideID.leftSideId][leftId]) {
        Vue.set(this.sideSelectionsToBlocks[SideID.leftSideId], leftId, []);
      }
      this.sideSelectionsToBlocks[SideID.leftSideId][leftId].push(block);

      if (!this.sideSelectionsToBlocks[SideID.rightSideId][rightId]) {
        Vue.set(this.sideSelectionsToBlocks[SideID.rightSideId], rightId, []);
      }
      this.sideSelectionsToBlocks[SideID.rightSideId][rightId].push(block);

      if (!this.leftMap.has(leftId)) {
        this.leftMap.set(leftId, []);
      }
      if (!this.leftMap.get(leftId)!.includes(rightId)) {
        this.leftMap.get(leftId)!.push(rightId);
      }

      if (!this.rightMap.has(rightId)) {
        this.rightMap.set(rightId, []);
      }
      if (!this.rightMap.get(rightId)!.includes(leftId)) {
        this.rightMap.get(rightId)!.push(leftId);
      }
    }
    this.sortMap(this.leftMap);
    this.sortMap(this.rightMap);
  }
}

</script>

<style lang="scss">
@use 'codeHighlightsColours';

.no-y-padding {
  padding-bottom: 0;
  padding-top: 0;
}

.slider-min-width {
  //min-width: 300px;
}
// disable scrolling
html, body {
  margin: 0;
  height: 100%;
  overflow: hidden
}
</style>
