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
          <pre id="codeLeft" class="line-numbers language-javascript"><code ref="codeLeft">{{codeLeft}}</code></pre>
        </v-col>
        <v-col sm="6">
          <pre id="codeRight" class="line-numbers language-javascript"><code ref="codeRight">{{codeRight}}</code></pre>
        </v-col>
      </v-row>
    </v-container>
    <v-card-actions>
      <v-btn @click="scrollTest">
        Hello
      </v-btn>
      <a href="#codeLeft.40">Test</a>
    </v-card-actions>

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

    get codeRight(): string {
      return this.intersection.rightFile.content;
    }

    get codeLeft(): string {
      return this.intersection.leftFile.content;
    }

    mounted(): void {
      this.highlight();
    }

    updated(): void {
      this.highlight();
    }

    highlight(): void {
      this.codeHighLight();
      this.lineHighlight();
    }

    codeHighLight(): void {
      if (this.$refs.codeRight) {
        Prism.highlightElement(this.$refs.codeRight as Element, false);
      }
      if (this.$refs.codeLeft) {
        Prism.highlightElement(this.$refs.codeLeft as Element, false);
      }
    }

    lineHighlight(): void {
      const codeLeft: HTMLElement = document.getElementById("codeLeft") as HTMLElement;
      const codeRight: HTMLElement = document.getElementById("codeRight") as HTMLElement;

      for (const index in this.intersection.fragments) {
        const block: Fragment = this.intersection.fragments[index];

        const options: HighlightOptions = {
          classes: "code-highlight",
          style: `filter: hue-rotate(${+index / this.intersection.fragments.length}turn)`
        };
        options.id = `code-highlight-${index}-left`;
        highlightLines(codeLeft, `${block.left.startRow}-${block.left.endRow}`, options)();
        options.id = `code-highlight-${index}-right`;
        highlightLines(codeRight, `${block.right.startRow}-${block.right.endRow}`, options)();
      }
    }

    scrollTest(): void {
      console.log("test");
    }
}
</script>

<style>
  #codeRight, #codeLeft {
    height: 70vh;
    overflow-y: scroll;
  }

  .code-highlight {
    pointer-events: all;
  }

  .code-highlight:hover {
    filter: brightness(1.5);
  }

</style>
