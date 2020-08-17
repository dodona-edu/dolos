<template>
  <v-card :loading="!loaded || !blocks">
    <v-card-title>
      {{leftFilename}}
      <v-spacer/>
      {{rightFilename}}
    </v-card-title>
    <v-container fluid>
      <v-row v-if="loaded && blocks" justify="center">
        <v-col sm="6">
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
        <v-col sm="6">
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
      </v-row>
    </v-container>
  </v-card>
</template>
<script lang="ts">

import { Component, Vue, Prop } from "vue-property-decorator";
import { Block, Diff, Selection } from "@/api/api";
import CompareSide from "@/components/CompareSide.vue";
import { constructID } from "@/util/OccurenceHighlight";

@Component({
  components: { CompareSide: CompareSide }
})
export default class Compare extends Vue {
  @Prop({ default: false }) loaded!: boolean;
  @Prop() diff!: Diff;
  @Prop() blocks!: Array<Block>

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

  get rightFilename(): string {
    return this.diff.rightFile.path;
  }

  get leftFilename(): string {
    return this.diff.leftFile.path;
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
   * @param op the operation that is performed, is either "add" or "remove"
   * @param sideId the id of the side where all the siblings are
   * @param blockClass the class used for selecting siblings and the cousins
   */
  private addClassesToSiblingsAndCousins(op: "add" | "remove", sideId: string, blockClass: string): void {
    for (const siblings of document.querySelectorAll(`#${sideId} .marked-code.${blockClass}`)) {
      siblings.classList[op]("hovering");
    }

    const other = this.sideMap.get(sideId)!.get(blockClass)![0];
    for (const cousins of document.querySelectorAll(`pre:not(#${sideId}) .marked-code.${other}`)) {
      cousins.classList[op]("hovering");
    }
  }

  onHoverEnterHandler(sideId: string, blockClasses: Array<string>): void {
    this.lastHovered.side = sideId;
    this.lastHovered.blockClasses = blockClasses;
    this.addClassesToSiblingsAndCousins("add", sideId, blockClasses[0]);
  }

  onHoverExitHandler(sideId: string, blockClasses: Array<string>): void {
    this.addClassesToSiblingsAndCousins("remove", sideId, blockClasses[0]);
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

    const visibleElements = document.querySelectorAll(".marked-code[class~=visible]") as NodeListOf<HTMLElement>;
    for (const visibleElement of visibleElements) {
      visibleElement.classList.remove("visible");
    }

    const firstBlocks = document.querySelectorAll(`#${sideId} .${id}`) as NodeListOf<HTMLElement>;
    const secondBlocks = document.querySelectorAll(`pre:not(#${sideId}) .${other}`) as NodeListOf<HTMLElement>;
    firstBlocks.forEach(val => val.classList.add("visible"));
    secondBlocks.forEach(val => val.classList.add("visible"));
    firstBlocks[0].scrollIntoView({ behavior: "smooth", block: "center" });
    secondBlocks[0].scrollIntoView({ behavior: "smooth", block: "center" });
  }

  get leftSelection(): Array<Selection> {
    console.log("here1");
    return this.blocks.map(block => block.left);
  }

  get rightSelection(): Array<Selection> {
    console.log("here2");
    return this.blocks.map(block => block.right);
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
    console.log("here3");
    for (const block of this.blocks) {
      const leftId = constructID(block.left);
      const rightId = constructID(block.right);

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

<style scoped>

</style>
