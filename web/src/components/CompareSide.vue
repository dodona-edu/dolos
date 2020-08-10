<template>
  <pre ref="pre" :id="identifier" class="line-numbers highlighted-code"><code
    ref="code"
    :class="language">{{content}}</code>
  </pre>

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
import { registerBlockHighlighting } from "@/util/OccurenceHighlight";

@Component
export default class CompareSide extends Vue {
  @Prop() identifier!: string;
  @Prop() selectionClickHandler!: (sideId: string, blockId: string) => void;
  @Prop() file!: File;
  @Prop() selections!: Array<Selection>;

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

  codeHighLight(): void {
    Prism.highlightElement(this.$refs.code as Element, false);
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
