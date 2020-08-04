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
        const baseID = `code-highlight-${index}`;
        const idLeft = `${baseID}-left`;
        const idRight = `${baseID}-right`;

        const options: HighlightOptions = {
          classes: "code-highlight",
          style: `--hue-rotate:${+index / this.intersection.fragments.length}turn`,
          callback: function (event: Event): void {
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
        };
        options.id = idLeft;
        highlightLines(codeLeft, `${block.left.startRow}-${block.left.endRow}`, options)();
        options.id = idRight;
        highlightLines(codeRight, `${block.right.startRow}-${block.right.endRow}`, options)();
      }
    }
}
</script>

<style>
  :root {
    --hue-rotate:0turn;
    --brightness:1;
  }
  #codeRight, #codeLeft {
    height: 70vh;
    overflow-y: scroll;
  }

  .code-highlight {
    pointer-events: all;
    filter: brightness(var(--brightness)) hue-rotate(var(--hue-rotate));
  }

  .code-highlight:hover {
    --brightness: 1.5;
  }

</style>
