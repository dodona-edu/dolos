<template>
  <div>
    <v-progress-linear
      :active="!loaded"
      position="absolute"
      :indeterminate="!loaded">
    </v-progress-linear>
    <pre ref="pre" :id="identifier" class="line-numbers highlighted-code"><code
      ref="code"
      :class="language">{{content}}</code>
    </pre>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Selection, File } from "@/api/api";

import Prism from "prismjs";
import "prismjs/themes/prism.css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-python";
import "prismjs/plugins/line-numbers/prism-line-numbers.js";
import "prismjs/plugins/line-numbers/prism-line-numbers.css";
import { ID_START, registerBlockHighlighting } from "@/util/OccurenceHighlight";

@Component
export default class CompareSide extends Vue {
  @Prop() identifier!: string;
  @Prop() selectionClickHandler!: (sideId: string, blockId: number, blockClasses: Array<string>) => void;
  @Prop() file!: File;
  @Prop() selections!: Array<Selection>;

  loaded = false;
  get content(): string {
    return this.file.content;
  }

  highlightLoaded = false;
  mounted(): void {
    this.highlight();
  }

  get language(): string {
    return `language-${this.$store.state.data.metadata.language}`;
  }

  highlight(): void {
    this.highlightLoaded = false;
    setTimeout(() => {
      new Promise(resolve => {
        registerBlockHighlighting(this.selections);
        this.codeHighLight();
        resolve();
      }).then(() => {
        this.highlightLoaded = true;
      });
    }, 0);
  }

  addEventListeners(): void {
    let id = 0;
    for (const value of document.querySelectorAll(`#${this.identifier} .marked-code`) as NodeListOf<HTMLElement>) {
      value.addEventListener("click", () => {
        return this.selectionClickHandler(
          this.identifier,
          id,
          [...value.classList].filter(className => className.startsWith(ID_START))
        );
      });
      id += 1;
    }
  }

  codeHighLight(): void {
    Prism.highlightElement(this.$refs.code as Element, false, () => {
      this.addEventListeners();
      this.loaded = true;
    });
  }
}
</script>

<style>

  .highlighted-code {
    height: 70vh;
    overflow-y: scroll;
  }

  .marked-code.visible {
    background: #ffd54f !important;
    text-shadow: none;
  }

  .marked-code {
    background: #ffecb3 !important;
    text-shadow: none;
  }

</style>
