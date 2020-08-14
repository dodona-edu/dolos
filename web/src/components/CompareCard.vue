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
                :side-identifier="SideId.leftSideId"
                :file="diff.leftFile"
                :selections="leftSelection"
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
                :side-identifier="SideId.leftSideId"
                :file="diff.rightFile"
                :selections="rightSelection"
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
import { constructID } from "@/util/OccurenceHighlight";
import * as d3 from "d3";

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
  leftMap!: Map<string, Array<string>>;
  rightMap!: Map<string, Array<string>>;
  // maps an id of a side to its map
  sideMap!: Map<string, Map<string, Array<string>>>;

  selected: {
    side?: string;
    blockClasses?: Array<string>;
    rightSide?: {
      blockClasses: Array<string>;
    };
    leftSide?: {
      blockClasses: Array<string>;
    };
  } = {};

  get SideId(): typeof SideID {
    return SideID;
  }

  lastHovered: {
    // side?: string;
    // blockClasses?: Array<string>;
    [key in SideID]: {
      blockClasses: Array<string>;
    };
  } = {
    [SideID.leftSideId]: { blockClasses: [] },
    [SideID.rightSideId]: { blockClasses: [] },
  };

  leftScrollFraction = 0;
  rightScrollFraction = 0;
  linesVisible = 0;

  onScrollHandler(sideId: string, scrollFraction: number): void {
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

  /**
   * Adds or removes the hovering class to all the direct siblings and cousins ( the corresponding blocks in the other
   * side)
   * @param addClass true if the classes are to be added, false if they have to be removed
   * @param sideId the id of the side where all the siblings are
   * @param blockClasses the classes used for selecting siblings and the cousins
   */
  private addClassesToSiblingsAndCousins(addClass: boolean, sideId: SideID, blockClasses: Array<string>): void {
    d3.selectAll(this.makeSelector(sideId, blockClasses))
      .classed("hovering", addClass);

    const otherClasses = this.getAllOtherBlockClasses(sideId, blockClasses);

    d3.selectAll(this.makeSelector(sideId, otherClasses, true))
      .classed("hovering", addClass);
  }

  makeSelector(sideId: SideID, blockClasses: Array<string>, otherSide = false, chart = false): string {
    if (otherSide) {
      let otherSideId = this.getOtherSide(sideId).toString();
      if (chart) {
        otherSideId += "-chart";
      }
      return blockClasses
        .map(blockClass => `#${otherSideId} .${blockClass}`)
        .join(", ");
    } else {
      let id = sideId.toString();
      if (chart) {
        id += "-chart";
      }
      return blockClasses
        .map(blockClass => `#${id} .${blockClass}`)
        .join(", ");
    }
  }

  getAllOtherBlockClasses(sideId: string, blockClasses: Array<string>): Array<string> {
    const map = this.sideMap.get(sideId)!;
    return blockClasses.flatMap(blockClass => map.get(blockClass)!);
  }

  onHoverEnterHandler(sideId: SideID, blockClasses: Array<string>, line?: number): void {
    const otherSideId = this.getOtherSide(sideId);
    const otherBlockClasses = this.getAllOtherBlockClasses(sideId, blockClasses);

    console.log(sideId, blockClasses);
    console.log(otherSideId, otherBlockClasses);

    this.lastHovered[sideId].blockClasses = blockClasses;
    this.lastHovered[otherSideId].blockClasses = otherBlockClasses;

    this.addClassesToSiblingsAndCousins(true, sideId, blockClasses);

    //
    // d3.selectAll(this.makeSelector(sideId, otherBlockClasses, true, true))
    //   .classed("hovering", true);
  }

  onHoverExitHandler(sideId: SideID, blockClasses: Array<string>, line?: number): void {
    this.addClassesToSiblingsAndCousins(false, sideId, blockClasses);

    const otherSideId = this.getOtherSide(sideId);
    this.lastHovered[sideId].blockClasses = [];
    this.lastHovered[otherSideId].blockClasses = [];
  }

  selectionClickEventHandler(sideId: SideID, blockClasses: Array<string>, line?: number): void {
    blockClasses.sort();
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

    d3.selectAll(".marked-code.visible")
      .classed("visible", false);

    d3.selectAll(".barcodeChartBar.selected")
      .classed("selected", false);

    if (line !== undefined) {
      d3.select(`#${sideId}-chart .barcodeChartBar.line-${line}`)
        .classed("selected", true);
    } else {
      d3.selectAll(this.makeSelector(sideId, blockClasses, false, true))
        .classed("selected", true);
    }

    const [startLine, endLine] = this.extractLinesFromSelectionId(other);
    const temp = [];
    for (let i = startLine; i <= endLine; i += 1) {
      temp.push(i);
    }

    const otherSideId = this.getOtherSide(sideId);
    const selector = temp.map(i => `#${otherSideId}-chart .barcodeChartBar.line-${i}`).join(", ");

    d3.selectAll(selector)
      .classed("selected", true);

    const firstSpans = document.querySelectorAll(`#${sideId} .${id}`) as NodeListOf<HTMLElement>;
    const secondSpans = document.querySelectorAll(`#${otherSideId} .${other}`) as NodeListOf<HTMLElement>;
    firstSpans.forEach(val => val.classList.add("visible"));
    secondSpans.forEach(val => val.classList.add("visible"));
    firstSpans[0].scrollIntoView({ behavior: "smooth", block: "center" });
    secondSpans[0].scrollIntoView({ behavior: "smooth", block: "center" });
  }

  extractLinesFromSelectionId(id: string): [number, number] {
    const values = id.split("-");
    return [+values[3], +values[5]];
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

  sortMap(map: Map<string, Array<string>>): void {
    for (const array of map.values()) {
      array.sort((el1, el2) => {
        const [row1, col1] = this.extractRowCol(el1);
        const [row2, col2] = this.extractRowCol(el2);
        const res = row1 - row2;
        if (res === 0) {
          return col1 - col2;
        } else {
          return res;
        }
      });
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
:root {
  --normalbg: #ffe390;
  --selectedbg: #ffd54f;
  --hoveringb: #ffecb3;
}

.highlighted-code {

  .marked-code.hovering {
    background: var(--hoveringb) !important;
    text-shadow: none;
  }

  /* this style is applied when selected */
  .marked-code.visible, .barcodeChartBar.selected {
    background: var(--selectedbg) !important;
    text-shadow: none;
  }

  .marked-code, .barcodeChartBar {
    background: var(--normalbg) !important;
    text-shadow: none;
  }
}

.barcodeChart {

  .barcodeChartBar {
    fill: #f5f2f0;
  }

  .barcodeChartBar.marked {
    fill: var(--normalbg);
  }

  .barcodeChartBar.marked.hovering {
    fill: var(--hoveringb);
  }

  .barcodeChartBar.marked.selected {
    fill: var(--selectedbg);
  }
}

pre.highlighted-code {
  margin-top: 0;
}
</style>
