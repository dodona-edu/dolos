<template>
  <v-card :loading="!loaded">
    <v-card-title>
      {{leftFilename}}
      <v-spacer/>
      {{rightFilename}}
    </v-card-title>
    <v-container fluid>
      <v-row v-if="loaded && diff" justify="center">
        <v-col sm="6">
          <compare-side
            :identifier="leftIdentifier"
            :file="diff.leftFile"
            :selections="leftSelection"
            :selection-click-handler="selectionClickEventHandler"
            :on-hover-enter="onHoverEnterHandler"
            :on-hover-exit="onHoverExitHandler"
          >
          </compare-side>
        </v-col>
        <v-col sm="6">
          <compare-side
            :identifier="rightIdentifier"
            :file="diff.rightFile"
            :selections="rightSelection"
            :selection-click-handler="selectionClickEventHandler"
            :on-hover-enter="onHoverEnterHandler"
            :on-hover-exit="onHoverExitHandler"
          >
          </compare-side>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>
<script lang="ts">

import { Component, Vue, Prop } from "vue-property-decorator";
import { Diff, Selection } from "@/api/api";
import CompareSide from "@/components/CompareSide.vue";
import { constructID } from "@/util/OccurenceHighlight";

@Component({
  components: { CompareSide: CompareSide }
})
export default class Compare extends Vue {
  @Prop({ default: false }) loaded!: boolean;
  @Prop() diff!: Diff;

  blockClickCount = 0;
  currentBlockClassIndex = 0;
  // this maps a selection id to all the other selection-ids that it corresponds with
  leftMap!: Map<string, Array<string>>;
  rightMap!: Map<string, Array<string>>;
  // maps an id of a side to its map
  sideMap!: Map<string, Map<string, Array<string>>>;

  lastClicked: {
    side: string | undefined;
    blockClasses: Array<string> | undefined;
  } = { side: undefined, blockClasses: undefined };

  lastHovered: {
    side: string | undefined;
    blockClasses: Array<string> | undefined;
  } = { side: undefined, blockClasses: undefined };

  get rightFilename(): string {
    return this.diff?.rightFile.path;
  }

  get leftFilename(): string {
    return this.diff?.leftFile.path;
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

  onHoverEnterHandler(sideId: string, blockClasses: Array<string>, element: HTMLElement): void {
    this.lastHovered.side = sideId;
    this.lastHovered.blockClasses = blockClasses;
    this.addClassesToSiblingsAndCousins("add", sideId, blockClasses[0]);
  }

  onHoverExitHandler(sideId: string, blockClasses: Array<string>, element: HTMLElement): void {
    this.addClassesToSiblingsAndCousins("remove", sideId, blockClasses[0]);
  }

  selectionClickEventHandler(sideId: string, blockClasses: Array<string>): void {
    blockClasses.sort();
    // if the there is nothing that was last clicked, or a different block from last time is clicked initialize the
    // values
    if (this.lastClicked.blockClasses === undefined || !(sideId === this.lastClicked.side &&
      this.lastClicked.blockClasses.toString() === blockClasses.toString())) {
      this.blockClickCount = 1;
      this.lastClicked.side = sideId;
      this.lastClicked.blockClasses = blockClasses;
    }

    const map = this.sideMap.get(sideId)!;
    let id = this.lastClicked.blockClasses[this.currentBlockClassIndex];
    let blocks = map.get(id)!;
    // cycles through all the possible combination for the current block
    if (this.blockClickCount === blocks.length) {
      this.blockClickCount = 1;
      this.currentBlockClassIndex = (this.currentBlockClassIndex + 1) % this.lastClicked.blockClasses.length;
      id = this.lastClicked.blockClasses[this.currentBlockClassIndex];
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
    return this.diff.hunks.map(fragment => fragment.left);
  }

  get rightSelection(): Array<Selection> {
    return this.diff.hunks.map(fragment => fragment.right);
  }

  extractRowCol(value: string): [number, number] {
    const matches = /([0-9]*)-([0-9]*)-[0-9]*-[0-9]*$/m.exec(value) as RegExpExecArray;
    return [+matches[1], +matches[2]];
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

  initializeMaps(): void {
    if (!this.diff) {
      return;
    }
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

<style>

.code-highlight {
  visibility: hidden;
  background: linear-gradient(to right, hsla(5.6, 100%, 50%, 0.29) 70%, hsla(24, 20%, 50%, 0));
  pointer-events: all;
}

.visible {
  visibility: visible;
}

.line-marker {
  background: hsla(24, 20%, 50%, 0);
  pointer-events: all;
}

.token {
  margin: -3px 0 -3px 0;
  padding: 3px 0 3px 0;
}
</style>
