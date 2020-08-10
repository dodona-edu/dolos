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
            identifier="leftSide"
            :file="diff.leftFile"
            :selections="leftSelection"
            :selection-click-handler="selectionClickEventHandler">
          </compare-side>
        </v-col>
        <v-col sm="6">
          <compare-side
            identifier="rightSide"
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

@Component({
  components: { CompareSide: CompareSide }
})
export default class Compare extends Vue {
    @Prop({ default: false }) loaded!: boolean;
    @Prop() diff!: Diff;
    // leftLines: Array<Array<string>> = [];
    // rightLines: Array<Array<string>> = [];
    // highlightsLoaded = false;
    // map: Map<string, Array<string>> = new Map();
    // blockHighlightOptions: BlockHighlightingOptions = {
    //   isLeftFile: true
    // }

    selectionClickEventHandler(sideId: string, blockId: string): void {
      console.log(sideId, blockId);
    }

    get leftSelection(): Array<Selection> {
      return this.diff.fragments.map(fragment => fragment.left);
    }

    get rightSelection(): Array<Selection> {
      return this.diff.fragments.map(fragment => fragment.right);
    }

    mounted(): void {
      // this.highlight();
    }

    updated(): void {
      // this.highlight();
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
    background: linear-gradient(to right, hsla(5.6, 100%, 50%, 0.29) 70%, hsla(24, 20%, 50%,0));
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
