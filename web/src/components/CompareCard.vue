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
          <pre id="codeLeft" class="line-numbers"><code ref="codeLeft" :class="language">{{codeLeft}}</code></pre>
        </v-col>
        <v-col sm="6">
          <pre id="codeRight" class="line-numbers"><code ref="codeRight" :class="language">{{codeRight}}</code></pre>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>
<script lang="ts">

import { Component, Vue, Prop } from "vue-property-decorator";
import { Hunk, Diff } from "@/api/api";
import Prism from "prismjs";
import "prismjs/themes/prism.css";
import "prismjs/components/prism-javascript";
import "prismjs/plugins/line-numbers/prism-line-numbers.js";
import "prismjs/plugins/line-numbers/prism-line-numbers.css";
import "prismjs/plugins/line-highlight/prism-line-highlight";
import "prismjs/plugins/line-highlight/prism-line-highlight.css";
import { BlockHighlightingOptions, registerBlockHighlighting } from "@/util/OccurenceHighlight";
import { highlightLines, HighlightOptions } from "@/util/line-highlight/prism-line-highlight.ts";

@Component
export default class Compare extends Vue {
    @Prop({ default: false }) loaded!: boolean;
    @Prop() diff!: Diff;
    leftLines: Array<Array<string>> = [];
    rightLines: Array<Array<string>> = [];
    map: Map<string, Array<string>> = new Map();
    blockHighlightOptions: BlockHighlightingOptions = {
      isLeftFile: true
    }

    linesAmount(side: "left" | "right"): number {
      let lines: Array<string>;
      if (side === "left") {
        lines = this.diff.leftFile.content.split("\n");
      } else {
        lines = this.diff.rightFile.content.split("\n");
      }
      return lines[lines.length - 1].length === 0 ? lines.length - 1 : lines.length;
    }

    get codeRight(): string {
      return this.diff.rightFile.content;
    }

    get codeLeft(): string {
      return this.diff.leftFile.content;
    }

    get language(): string {
      return `language-${this.$store.state.data.metadata.language}`;
    }

    mounted(): void {
      if (this.diff) {
        this.map = registerBlockHighlighting(this.diff, this.blockHighlightOptions);
        this.highlight();
      }
    }

    updated(): void {
      this.map = registerBlockHighlighting(this.diff, this.blockHighlightOptions);
      this.highlight();
    }

    highlight(): void {
      if (this.diff) {
        this.codeHighLight();
        // this.blockHighlight();
        // this.drawLineMarkers();
      }
    }

    // drawLineMarkers(): void {
    //   const codeLeft: HTMLElement = document.getElementById("codeLeft") as HTMLElement;
    //   const codeRight: HTMLElement = document.getElementById("codeRight") as HTMLElement;
    //
    //   const options: HighlightOptions = {
    //     classes: "line-marker",
    //   };
    //
    //   for (let i = 1; i <= this.linesAmount("left"); i += 1) {
    //     highlightLines(
    //       codeLeft,
    //       `${i}`,
    //       { id: `line-left-${i}`, callback: event => this.lineClick(i, "left", event), ...options }
    //     )();
    //   }
    //
    //   for (let i = 1; i <= this.linesAmount("right"); i += 1) {
    //     highlightLines(
    //       codeRight,
    //       `${i}`,
    //       { id: `line-right-${i}`, callback: event => this.lineClick(i, "right", event), ...options }
    //     )();
    //   }
    // }

    codeHighLight(): void {
      if (this.$refs.codeLeft) {
        this.blockHighlightOptions.isLeftFile = true;
        Prism.highlightElement(this.$refs.codeLeft as Element, false);
      }
      if (this.$refs.codeRight) {
        this.blockHighlightOptions.isLeftFile = false;
        Prism.highlightElement(this.$refs.codeRight as Element, false);
      }
    }

    blockHighlight(): void {
      const codeLeft: HTMLElement = document.getElementById("codeLeft") as HTMLElement;
      const codeRight: HTMLElement = document.getElementById("codeRight") as HTMLElement;

      // this.leftLines = ;
      // this.rightLines = new Array(this.linesAmount("right"));
      const tempLeftLines: Array<Array<[number, string]>> = new Array(this.linesAmount("left"));
      const tempRightLines: Array<Array<[number, string]>> = new Array(this.linesAmount("right"));

      for (const index in this.diff.fragments) {
        const block: Hunk = this.diff.fragments[index];
        const baseID = `code-highlight-${index}`;

        // register the fragments to the lines they span over
        for (let i = block.left.startRow; i <= block.left.endRow; i += 1) {
          if (!tempLeftLines[i]) {
            tempLeftLines[i] = [];
          }
          tempLeftLines[i].push([block.right.startRow, baseID]);
        }

        for (let i = block.right.startRow; i <= block.right.endRow; i += 1) {
          if (!tempRightLines[i]) {
            tempRightLines[i] = [];
          }
          tempRightLines[i].push([block.left.startRow, baseID]);
        }

        const idLeft = `${baseID}-left`;
        const idRight = `${baseID}-right`;

        const options: HighlightOptions = {
          classes: "code-highlight",
          callback: this.scrollToCorrespondingBlock
        };

        highlightLines(
          codeLeft,
          `${block.left.startRow + 1}-${block.left.endRow + 1}`,
          { id: idLeft, ...options }
        )();

        highlightLines(
          codeRight,
          `${block.right.startRow + 1}-${block.right.endRow + 1}`,
          { id: idRight, ...options }
        )();
      }
      function process(arr: Array<[number, string]>): Array<string> {
        return arr.sort(([row1], [row2]) => row1 - row2).map(([, id]) => id);
      }

      this.leftLines = tempLeftLines.map(process);
      this.rightLines = tempRightLines.map(process);
    }

    scrollToCorrespondingBlock(event: Event): void {
      if (event.target) {
        let id = (event.target as HTMLElement).id;
        if (id.includes("left")) {
          id = id.replace("left", "right");
        } else {
          id = id.replace("right", "left");
        }
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
}
</script>

<style>
  :root {
    --hue-rotate:0turn;
    --brightness:1;
    --transistion: 0.1s
  }
  #codeRight, #codeLeft {
    height: 70vh;
    overflow-y: scroll;
  }

  .code-highlight {
    visibility: hidden;
    background: linear-gradient(to right, hsla(5.6, 100%, 50%, 0.29) 70%, hsla(24, 20%, 50%,0));
    pointer-events: all;
    transition: var(--transistion);
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
    transition: var(--transistion);
  }

  .highlighted-code.visible {
    background: #ffd54f !important;
    text-shadow: none;
  }

  .highlighted-code {
    background: #ffecb3 !important;
    text-shadow: none;
  }
  .token {
    margin: -3px 0 -3px 0;
    padding: 3px 0 3px 0;
  }

</style>
