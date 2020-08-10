<template>
  <v-card :loading="!loaded || !highlightsLoaded">
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
import "prismjs/components/prism-python";
import { BlockHighlightingOptions, registerBlockHighlighting } from "@/util/OccurenceHighlight";

@Component
export default class Compare extends Vue {
    @Prop({ default: false }) loaded!: boolean;
    @Prop() diff!: Diff;
    leftLines: Array<Array<string>> = [];
    rightLines: Array<Array<string>> = [];
    highlightsLoaded = false;
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
      this.highlight();
    }

    updated(): void {
      // this.highlight();
    }

    highlight(): void {
      this.highlightsLoaded = false;
      setTimeout(() => {
        new Promise(resolve => {
          if (this.diff) {
            this.map = registerBlockHighlighting(this.diff, this.blockHighlightOptions);
            this.codeHighLight();
          }
          resolve();
        }).then(() => {
          this.highlightsLoaded = true;
        });
      }, 0);
    }

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
