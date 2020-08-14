<template>
  <v-card :loading="!loaded">
    <v-card-title>
      {{ leftFilename }}
      <v-spacer/>
      {{ rightFilename }}
    </v-card-title>
    <v-container fluid>
      <v-row v-if="loaded" justify="center" no-gutters>
        <v-col sm="6">
          <v-row no-gutters>
            <v-col cols="11">
              <compare-side
                ref="leftCompareSide"
                :identifier="SideId.leftSideId"
                :file="diff.leftFile"
                :selections="leftSelection"
                :selected-selections="selected.sides.leftSideId.blockClasses"
                :hovering-selections="lastHovered.leftSideId.blockClasses"
                @selectionclick="selectionClickEventHandler"
                @selectionhoverenter="onHoverEnterHandler"
                @selectionhoverexit="onHoverExitHandler"
                @linesvisibleamount="setLinesVisible"
              >
              </compare-side>
            </v-col>
            <v-col cols="auto">
              <BarcodeChart
                :selections="leftSelection"
                :side-identifier="SideId.leftSideId"
                :maxLines="maxLines"
                :lines="leftLines"
                :amount-of-lines-visible="linesVisible"
                :document-scroll-fraction="leftScrollFraction"
                :hovering-selections="lastHovered.leftSideId.blockClasses"
                :selected-selections="selected.sides.leftSideId.blockClasses"
                @selectionclick="selectionClickEventHandler"
                @selectionhoverenter="onHoverEnterHandler"
                @selectionhoverexit="onHoverExitHandler"
              ></BarcodeChart>
            </v-col>
          </v-row>
        </v-col>
        <v-col sm="6">
          <v-row no-gutters>
            <v-col cols="11">
              <compare-side
                :identifier="SideId.rightSideId"
                :file="diff.rightFile"
                :selections="rightSelection"
                :hovering-selections="lastHovered.rightSideId.blockClasses"
                :selected-selections="selected.sides.rightSideId.blockClasses"
                @selectionclick="selectionClickEventHandler"
                @selectionhoverenter="onHoverEnterHandler"
                @selectionhoverexit="onHoverExitHandler"
                @codescroll="onScrollHandler"
              >
              </compare-side>
            </v-col>
            <v-col cols="auto">
              <BarcodeChart
                :selections="rightSelection"
                :side-identifier="SideId.rightSideId"
                :maxLines="maxLines"
                :lines="rightLines"
                :document-scroll-fraction="rightScrollFraction"
                :amount-of-lines-visible="linesVisible"
                :hovering-selections="lastHovered.rightSideId.blockClasses"
                :selected-selections="selected.sides.rightSideId.blockClasses"
                @selectionclick="selectionClickEventHandler"
                @selectionhoverenter="onHoverEnterHandler"
                @selectionhoverexit="onHoverExitHandler"
                @codescroll="onScrollHandler"
              ></BarcodeChart>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>
<script lang="ts">

import { Component, Vue, Prop } from "vue-property-decorator";
import { Diff, Selection } from "@/api/api";
import CompareSide from "@/components/CompareSide.vue";
import BarcodeChart from "@/components/BarcodeChart.vue";
import { constructID, SelectionId } from "@/util/OccurenceHighlight";
// import * as d3 from "d3";

export enum SideID {
  leftSideId = "leftSideId",
  rightSideId = "rightSideId"
}

@Component({
  components: { CompareSide, BarcodeChart }
})
export default class Compare extends Vue {
  @Prop({ default: false }) loaded!: boolean;
  @Prop() diff!: Diff;

  blockClickCount = 0;
  currentBlockClassIndex = 0;
  // this maps a selected id to all the other selected-ids that it corresponds with
  leftMap!: Map<SelectionId, Array<SelectionId>>;
  rightMap!: Map<SelectionId, Array<SelectionId>>;
  // maps an id of a side to its map
  sideMap!: Map<SideID, Map<SelectionId, Array<SelectionId>>>;

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

  get SideId(): typeof SideID {
    return SideID;
  }

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

  mounted(): void {
    this.initialize();
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
    const otherSideId = this.getOtherSide(sideId);
    const otherBlockClasses = this.getAllOtherBlockClasses(sideId, blockClasses);

    this.lastHovered[sideId].blockClasses = blockClasses;
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
      this.selected.side = sideId;
      this.selected.blockClasses = blockClasses.slice();
    }

    const map = this.sideMap.get(sideId)!;
    let id = this.selected.blockClasses[this.currentBlockClassIndex];
    let blocks = map.get(id)!;
    // cycles through all the blocks on the other side and if all the blocks have been cycled through, go to the next
    // set of blocks
    if (this.blockClickCount === blocks.length) {
      this.blockClickCount = 1;
      this.currentBlockClassIndex = (this.currentBlockClassIndex + 1) % this.selected.blockClasses.length;
      id = this.selected.blockClasses[this.currentBlockClassIndex];
      blocks = map.get(id)!;
    } else {
      this.blockClickCount += 1;
    }

    const other = blocks[this.blockClickCount - 1] as string;
    return [id, other];
  }

  selectionClickEventHandler(sideId: SideID, blockClasses: Array<string>): void {
    const [id, other] = this.cycle(sideId, blockClasses);

    this.selected.sides[sideId].blockClasses = [id];
    this.selected.sides[this.getOtherSide(sideId)].blockClasses = [other];
  }

  get leftSelection(): Array<Selection> {
    return this.diff.hunks.map(fragment => fragment.left);
  }

  get rightSelection(): Array<Selection> {
    return this.diff.hunks.map(fragment => fragment.right);
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
    for (const fragment of this.diff.hunks) {
      const leftId = constructID(fragment.left);
      const rightId = constructID(fragment.right);

      if (!this.leftMap.has(leftId)) {
        this.leftMap.set(leftId, []);
      }
      this.leftMap.get(leftId)!.push(rightId);

      if (!this.rightMap.has(rightId)) {
        this.rightMap.set(rightId, []);
      }
      this.rightMap.get(rightId)!.push(leftId);
    }
    this.sortMap(this.leftMap);
    this.sortMap(this.rightMap);
  }
}

</script>

<style lang="scss">
@use 'codeHighlightsColours';

</style>
