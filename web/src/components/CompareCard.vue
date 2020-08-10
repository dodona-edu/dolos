<template>
  <v-card :loading="!loaded">
    <v-card-title>
      One
      <v-spacer/>
      Other
    </v-card-title>
    <v-container fluid>
      <v-row v-if="loaded && diff" justify="center">
        <v-col sm="6">
          <compare-side
            :identifier="leftIdentifier"
            :file="diff.leftFile"
            :selections="leftSelection"
            :selection-click-handler="selectionClickEventHandler">
          </compare-side>
        </v-col>
        <v-col sm="6">
          <compare-side
            :identifier="rightIdentifier"
            :file="diff.rightFile"
            :selections="rightSelection"
            :selection-click-handler="selectionClickEventHandler">
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

  lastClickSide!: string;
  lastClickedBlockId!: number;
  lastClickedBlockClasses!: Array<string>;
  blockClickCount = 0;
  leftMap!: Map<string, Array<string>>;
  rightMap!: Map<string, Array<string>>;
  sideMap!: Map<string, Map<string, Array<string>>>;

  mounted(): void {
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

  selectionClickEventHandler(sideId: string, blockId: number, blockClasses: Array<string>): void {
    console.log(sideId, blockId, blockClasses);
    if (!(sideId === this.lastClickSide && blockId === this.lastClickedBlockId)) {
      this.blockClickCount = 0;
      this.lastClickSide = sideId;
      this.lastClickedBlockId = blockId;
      this.lastClickedBlockClasses = blockClasses;
    }
    const map = this.sideMap.get(sideId)!;
    let id = this.lastClickedBlockClasses[0];
    let blocks = map.get(id)!;
    if (this.blockClickCount === blocks.length) {
      this.blockClickCount = 0;
      this.lastClickedBlockClasses.push(this.lastClickedBlockClasses.shift()!);
      id = this.lastClickedBlockClasses[0];
      blocks = map.get(id)!;
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

    this.blockClickCount += 1;
  }

  get leftSelection(): Array<Selection> {
    return this.diff.fragments.map(fragment => fragment.left);
  }

  get rightSelection(): Array<Selection> {
    return this.diff.fragments.map(fragment => fragment.right);
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
    for (const fragment of this.diff.fragments) {
      const leftId = constructID(fragment.left);
      const rightId = constructID(fragment.right);
      console.log(leftId, rightId);

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
    console.log(this.leftMap.entries());
    console.log(this.rightMap.entries());
  }

  // scrollToCorrespondingBlock(event: Event): void {
  //   if (event.target) {
  //     let id = (event.target as HTMLElement).id;
  //     if (id.includes("left")) {
  //       id = id.replace("left", "right");
  //     } else {
  //       id = id.replace("right", "left");
  //     }
  //     const element = document.getElementById(id);
  //     if (element) {
  //       element.scrollIntoView({ behavior: "smooth" });
  //     }
  //   }
  // }
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

.code-highlight:hover {
  filter: brightness(2);
  /*background: hsla(14.1, 100%, 50%, 0.31);*/
}

.token {
  margin: -3px 0 -3px 0;
  padding: 3px 0 3px 0;
}

</style>
