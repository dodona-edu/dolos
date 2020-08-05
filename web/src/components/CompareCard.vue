<template>
  <v-card :loading="!loaded">
    <v-card-title>
      One
      <v-spacer/>
      Other
    </v-card-title>
    <v-container fluid>
      <v-row v-if="loaded && intersection" justify="center">
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
import { Fragment, Intersection } from "@/api/api";
import Prism from "prismjs";
import "prismjs/themes/prism.css";
import "prismjs/components/prism-javascript";
import "prismjs/plugins/line-numbers/prism-line-numbers.js";
import "prismjs/plugins/line-numbers/prism-line-numbers.css";
import "prismjs/plugins/line-highlight/prism-line-highlight";
import "prismjs/plugins/line-highlight/prism-line-highlight.css";
import { highlightLines, HighlightOptions } from "@/util/line-highlight/prism-line-highlight.ts";

@Component
export default class Compare extends Vue {
    @Prop({ default: false }) loaded!: boolean;
    @Prop() intersection!: Intersection;
    leftLines: Array<Array<string>> = [];
    rightLines: Array<Array<string>> = [];

    get codeRight(): string {
      return this.intersection.rightFile.content;
    }

    get codeLeft(): string {
      return this.intersection.leftFile.content;
    }

    get language(): string {
      return `language-${this.$store.state.data.metadata.language}`;
    }

    updated(): void {
      this.highlight();
    }

    highlight(): void {
      this.codeHighLight();
      this.blockHighlight();
      this.tempFunction();
    }

    lineClick(line: number, side: "left" | "right", event: Event): void {
      let id: string | undefined;
      if (side === "left" && this.leftLines[line - 1]) {
        id = this.leftLines[line - 1][0];
      } else if (side === "right" && this.rightLines[line - 1]) {
        id = this.rightLines[line - 1][0];
      }
      if (!id) {
        return;
      }
      const leftBlock = document.getElementById(`${id}-left`) as HTMLElement;
      const rightBlock = document.getElementById(`${id}-right`) as HTMLElement;
      const visibleElements = document.querySelectorAll(".line-highlight[class~=visible]") as NodeListOf<HTMLElement>;
      for (const visibleElement of visibleElements) {
        visibleElement.classList.remove("visible");
      }
      leftBlock.classList.add("visible");
      rightBlock.classList.add("visible");
      leftBlock.scrollIntoView({ behavior: "smooth" });
      rightBlock.scrollIntoView({ behavior: "smooth" });
    }

    tempFunction(): void {
      const codeLeft: HTMLElement = document.getElementById("codeLeft") as HTMLElement;
      const codeRight: HTMLElement = document.getElementById("codeRight") as HTMLElement;
      const linesLeft = this.intersection.leftFile.content.split("\n");
      const linesRight = this.intersection.rightFile.content.split("\n");
      // prismjs strips the last line of code if it is empty so we have to take that into account
      const linesAmountLeft = linesLeft[linesLeft.length - 1].length === 0 ? linesLeft.length - 1 : linesLeft.length;
      const linesAmountRight = linesRight[linesRight.length - 1].length === 0
        ? linesRight.length - 1 : linesRight.length;

      const options: HighlightOptions = {
        classes: "line-marker",
      };

      for (let i = 1; i <= linesAmountLeft; i += 1) {
        highlightLines(
          codeLeft,
          `${i}`,
          { id: `line-left-${i}`, callback: event => this.lineClick(i, "left", event), ...options }
        )();
      }

      for (let i = 1; i <= linesAmountRight; i += 1) {
        highlightLines(
          codeRight,
          `${i}`,
          { id: `line-right-${i}`, callback: event => this.lineClick(i, "right", event), ...options }
        )();
      }
    }

    codeHighLight(): void {
      if (this.$refs.codeRight) {
        Prism.highlightElement(this.$refs.codeRight as Element, false);
      }
      if (this.$refs.codeLeft) {
        Prism.highlightElement(this.$refs.codeLeft as Element, false);
      }
    }

    blockHighlight(): void {
      const codeLeft: HTMLElement = document.getElementById("codeLeft") as HTMLElement;
      const codeRight: HTMLElement = document.getElementById("codeRight") as HTMLElement;

      const linesLeft = this.intersection.leftFile.content.split("\n");
      const linesRight = this.intersection.rightFile.content.split("\n");
      const linesAmountLeft = linesLeft[linesLeft.length - 1].length === 0 ? linesLeft.length - 1 : linesLeft.length;
      const linesAmountRight = linesRight[linesRight.length - 1].length === 0
        ? linesRight.length - 1 : linesRight.length;
      this.leftLines = new Array(linesAmountLeft);
      this.rightLines = new Array(linesAmountRight);

      for (const index in this.intersection.fragments) {
        const block: Fragment = this.intersection.fragments[index];
        const baseID = `code-highlight-${index}`;

        // register the fragments to the lines they span over
        for (let i = block.left.startRow; i <= block.left.endRow; i += 1) {
          if (!this.leftLines[i]) {
            this.leftLines[i] = [];
          }
          this.leftLines[i].push(baseID);
        }
        for (let i = block.right.startRow; i <= block.right.endRow; i += 1) {
          if (!this.rightLines[i]) {
            this.rightLines[i] = [];
          }
          this.rightLines[i].push(baseID);
        }

        const idLeft = `${baseID}-left`;
        const idRight = `${baseID}-right`;

        const options: HighlightOptions = {
          classes: "code-highlight",
          callback: this.scrollToCorrespondingBlock
        };
        options.id = idLeft;
        console.log(idLeft, block.left.startRow + 1, block.left.endRow + 1);
        highlightLines(codeLeft, `${block.left.startRow + 1}-${block.left.endRow + 1}`, options)();
        options.id = idRight;
        console.log(idRight, block.right.startRow + 1, block.right.endRow + 1);
        highlightLines(codeRight, `${block.right.startRow + 1}-${block.right.endRow + 1}`, options)();
      }
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

</style>
