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
                :identifier="leftIdentifier"
                :file="diff.leftFile"
                :selections="leftSelection"
                @selectionclick="selectionClickEventHandler"
                @selectionhoverenter="onHoverEnterHandler"
                @selectionhoverexit="onHoverExitHandler"
              >
              </compare-side>
            </v-col>
            <v-col cols="auto">
              <BarcodeChart
                :selections="leftSelection"
                :side-identifier="leftIdentifier"
                :maxLines="maxLines"
                :lines="leftLines"
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
                :identifier="rightIdentifier"
                :file="diff.rightFile"
                :selections="rightSelection"
                @selectionclick="selectionClickEventHandler"
                @selectionhoverenter="onHoverEnterHandler"
                @selectionhoverexit="onHoverExitHandler"
              >
              </compare-side>
            </v-col>
            <v-col cols="auto">
              <BarcodeChart
                :selections="rightSelection"
                :side-identifier="rightIdentifier"
                :maxLines="maxLines"
                :lines="rightLines"
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
</template>
<script lang="ts">

import { Component, Vue, Prop } from "vue-property-decorator";
import { Diff, Selection } from "@/api/api";
import CompareSide from "@/components/CompareSide.vue";
import BarcodeChart from "@/components/BarcodeChart.vue";
import { constructID } from "@/util/OccurenceHighlight";
import * as d3 from "d3";

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
  } = {};

  lastHovered: {
    side?: string;
    blockClasses?: Array<string>;
  } = {};

  get leftLines(): number {
    return this.diff.leftFile.content.split("\n").length;
  }

  get rightLines(): number {
    return this.diff.rightFile.content.split("\n").length;
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
      [this.rightIdentifier, this.rightMap],
      [this.leftIdentifier, this.leftMap]
    ]);
    this.initializeMaps();
  }

  get rightIdentifier(): string {
    return "rightSide";
  }

  get leftIdentifier(): string {
    return "leftSide";
  }

  /**
   * Adds or removes the hovering class to all the direct siblings and cousins ( the corresponding blocks in the other
   * side)
   * @param addClass true if the classes are to be added, false if they have to be removed
   * @param sideId the id of the side where all the siblings are
   * @param blockClasses the classes used for selecting siblings and the cousins
   */
  private addClassesToSiblingsAndCousins(addClass: boolean, sideId: string, blockClasses: Array<string>): void {
    d3.selectAll(this.makeSelector(sideId, blockClasses))
      .classed("hovering", addClass);

    const otherClasses = this.getAllOtherBlockClasses(sideId, blockClasses);

    d3.selectAll(this.makeSelector(sideId, otherClasses, true))
      .classed("hovering", addClass);
  }

  makeSelector(sideId: string, blockClasses: Array<string>, otherSide = false): string {
    if (otherSide) {
      return blockClasses
        .map(blockClass => `:not(#${sideId}) .${blockClass}`)
        .join(", ");
    } else {
      return blockClasses
        .map(blockClass => `#${sideId} .${blockClass}`)
        .join(", ");
    }
  }

  getAllOtherBlockClasses(sideId: string, blockClasses: Array<string>): Array<string> {
    const map = this.sideMap.get(sideId)!;
    return blockClasses.flatMap(blockClass => map.get(blockClass)!);
  }

  onHoverEnterHandler(sideId: string, blockClasses: Array<string>): void {
    this.lastHovered.side = sideId;
    this.lastHovered.blockClasses = blockClasses;
    this.addClassesToSiblingsAndCousins(true, sideId, blockClasses);

    // d3.selectAll(".barcodeChartBar")
    //   .style("opacity", 0.2);

    d3.selectAll(this.makeSelector(sideId + "-chart", blockClasses))
      .classed("hovering", true);

    const otherBlockClasses = this.getAllOtherBlockClasses(sideId, blockClasses);
    d3.selectAll(this.makeSelector(sideId + "-chart", otherBlockClasses, true))
      .classed("hovering", true);
  }

  onHoverExitHandler(sideId: string, blockClasses: Array<string>): void {
    this.addClassesToSiblingsAndCousins(false, sideId, blockClasses);

    d3.selectAll(".barcodeChartBar.hovering")
      .classed("hovering", false);
    //   .style("opacity", 0.6);
    //
    // if (this.selected.side && this.selected.blockClasses) {
    //   d3.selectAll(this.makeSelector(this.selected.side + "-chart", this.selected.blockClasses))
    //     .style("opacity", 1);
    //
    //   const otherBlockClasses = this.getAllOtherBlockClasses(this.selected.side, this.selected.blockClasses);
    //   d3.selectAll(this.makeSelector(this.selected.side + "-chart", otherBlockClasses, true))
    //     .style("opacity", 1);
    // }
  }

  selectionClickEventHandler(sideId: string, blockClasses: Array<string>): void {
    blockClasses.sort();
    // if the there is nothing that was last clicked, or a different block from last time is clicked initialize the
    // values
    if (this.selected.blockClasses === undefined || !(sideId === this.selected.side &&
      this.selected.blockClasses.toString() === blockClasses.toString())) {
      this.currentBlockClassIndex = 0;
      this.blockClickCount = 1;
      this.selected.side = sideId;
      this.selected.blockClasses = blockClasses;
    }

    const map = this.sideMap.get(sideId)!;
    let id = this.selected.blockClasses[this.currentBlockClassIndex];
    let blocks = map.get(id)!;
    // cycles through all the possible combination for the current block
    if (this.blockClickCount === blocks.length) {
      this.blockClickCount = 1;
      this.currentBlockClassIndex = (this.currentBlockClassIndex + 1) % this.selected.blockClasses.length;
      id = this.selected.blockClasses[this.currentBlockClassIndex];
      blocks = map.get(id)!;
    } else {
      this.blockClickCount += 1;
    }

    const other = blocks.shift() as string;
    blocks.push(other);

    d3.selectAll(".marked-code.visible")
      .classed("visible", false);

    d3.selectAll(".barcodeChartBar.selected")
      .classed("selected", false);

    d3.selectAll(this.makeSelector(sideId + "-chart", blockClasses))
      .classed("selected", true);

    d3.selectAll(this.makeSelector(sideId + "-chart", this.getAllOtherBlockClasses(sideId, blockClasses), true))
      .classed("selected", true);

    const firstBlocks = document.querySelectorAll(`#${sideId} .${id}`) as NodeListOf<HTMLElement>;
    const secondBlocks = document.querySelectorAll(`pre:not(#${sideId}) .${other}`) as NodeListOf<HTMLElement>;
    firstBlocks.forEach(val => val.classList.add("visible"));
    secondBlocks.forEach(val => val.classList.add("visible"));
    firstBlocks[0].scrollIntoView({ behavior: "smooth", block: "center" });
    secondBlocks[0].scrollIntoView({ behavior: "smooth", block: "center" });
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
    .marked-code.visible,  .barcodeChartBar.selected {
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
      fill: var(--normalbg);
    }

    .barcodeChartBar.hovering {
      fill: var(--hoveringb);
    }

    .barcodeChartBar.selected {
      fill: var(--selectedbg);
    }
  }

  pre.highlighted-code {
      margin-top: 0;
  }
</style>
