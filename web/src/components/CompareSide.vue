<template>
  <div>
    <pre v-scroll.self="onScroll" ref="pre" :id="identifier" class="line-numbers highlighted-code"><code
      ref="codeblock"
      :class="language">{{content}}</code>
    </pre>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { Selection, File } from "@/api/api";

import Prism from "prismjs";
import "prismjs/themes/prism.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.js";
import "prismjs/plugins/line-numbers/prism-line-numbers.css";
import { ID_START, registerBlockHighlighting } from "@/util/OccurenceHighlight";
import * as d3 from "d3";
// import {SideID} from "@/components/CompareCard.vue";

@Component
export default class CompareSide extends Vue {
  @Prop() identifier!: string;
  @Prop() selectionClickHandler!: (sideId: string, blockClasses: Array<string>) => void;
  @Prop() onHoverEnter!: (sideId: string, blockClasses: Array<string>, element: HTMLElement) => void;
  @Prop() onHoverExit!: (sideId: string, blockClasses: Array<string>, element: HTMLElement) => void;
  @Prop() file!: File;
  @Prop() selections!: Array<Selection>;
  @Prop() hoveringSelections!: Array<string>;

  get content(): string {
    return this.file.content;
  }

  get language(): string {
    return `language-${this.$store.state.data.metadata.language}`;
  }

  makeSelector(blockClasses: Array<string>): string {
    return blockClasses
      .map(blockClass => `#${this.identifier} .${blockClass}`)
      .join(", ");
  }

  @Watch("hoveringSelections", { deep: true })
  onHoverSelectionsChange(newValue: Array<string>): void {
    d3.selectAll(`#${this.identifier} .marked-code.hovering`)
      .classed("hovering", false);

    if (newValue.length > 0) {
      d3.selectAll(this.makeSelector(newValue))
        .classed("hovering", true);
    }
  }

  onScroll(e: Event): void {
    const scrollTop = (e.target as HTMLElement)?.scrollTop;
    const maxScroll = (this.$refs.codeblock as HTMLElement).getBoundingClientRect().height;
    const temp = (this.$refs.pre as HTMLElement).clientHeight;
    this.$emit("codescroll", this.identifier, Math.min(1, scrollTop / (maxScroll - temp)));
  }

  /**
   * Returns an approximation of the amount of visible lines if all lines where filled in.
   */
  getLinesVisibleAmount(): number {
    const lineNumber = document.querySelector(".line-numbers-rows :first-child");
    if (!lineNumber) {
      return 0;
    }
    const height = (this.$refs.pre as HTMLElement).getBoundingClientRect().height;
    return height / lineNumber.getBoundingClientRect().height;
  }

  async mounted(): Promise<void> {
    await this.highlight();
    this.$emit("linesvisibleamount", this.getLinesVisibleAmount());
    window.addEventListener("resize", () => {
      this.$emit("linesvisibleamount", this.getLinesVisibleAmount());
    });
  }

  async installLanguage(): Promise<void> {
    const currentLanguage: string = this.$store.state.data.metadata.language.toLowerCase();
    if (Prism.languages[currentLanguage]) {
      return;
    }
    await require("prismjs/components/prism-" + currentLanguage);
  }

  async highlight(): Promise<void> {
    await this.installLanguage();
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
    padding-top: 0 !important;

    .token {
      margin: -4px 0 -4px 0;
      padding: 4px 0 4px 0;
    }
  }

</style>
