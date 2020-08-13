<template>
  <div>
    <pre v-scroll.self="onScroll" ref="pre" :id="identifier" class="line-numbers highlighted-code"><code
      ref="codeblock"
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
  @Prop() selectionClickHandler!: (sideId: string, blockClasses: Array<string>) => void;
  @Prop() onHoverEnter!: (sideId: string, blockClasses: Array<string>, element: HTMLElement) => void;
  @Prop() onHoverExit!: (sideId: string, blockClasses: Array<string>, element: HTMLElement) => void;
  @Prop() file!: File;
  @Prop() selections!: Array<Selection>;
  get content(): string {
    return this.file.content;
  }

  onScroll(e: Event): void {
    const scrollTop = (e.target as HTMLElement)?.scrollTop;
    const maxScroll = (this.$refs.codeblock as HTMLElement).getBoundingClientRect().height;
    const temp = (this.$refs.pre as HTMLElement).clientHeight;
    this.$emit("codescroll", this.identifier, Math.min(1, scrollTop / (maxScroll - temp)));
  }

  // get codeBlockIdentifier(): string {
  //   return this.identifier + "code-block";
  // }

  mounted(): void {
    this.highlight();
  }

  get language(): string {
    return `language-${this.$store.state.data.metadata.language}`;
  }

  highlight(): void {
    registerBlockHighlighting(this.selections);
    this.codeHighLight();
  }

  addEventListeners(): void {
    for (const value of document.querySelectorAll(`#${this.identifier} .marked-code`) as NodeListOf<HTMLElement>) {
      const filteredClassList = [...value.classList].filter(className => className.startsWith(ID_START));
      value.addEventListener("click", () => {
        this.$emit("selectionclick", this.identifier, filteredClassList);
      });

      value.addEventListener("mouseout", () => {
        this.$emit("selectionhoverexit", this.identifier, filteredClassList);
      });

      value.addEventListener("mouseover", () => {
        this.$emit("selectionhoverenter", this.identifier, filteredClassList);
      });
    }
  }

  codeHighLight(): void {
    Prism.highlightElement(this.$refs.codeblock as Element, false, () => {
      this.addEventListeners();
    });
  }
}
</script>

<style lang="scss">

  .highlighted-code {
    height: 70vh;
    overflow-y: scroll;

    .token {
      margin: -4px 0 -4px 0;
      padding: 4px 0 4px 0;
    }
  }

</style>
