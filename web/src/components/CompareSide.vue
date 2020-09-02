<template>
  <div>
    <component :is="'style'" type="text/css">

      <template v-for="item in activeSelections">
        .token.marked-code.{{item}} {
        background: var(--markedbg);
        text-shadow: none;
        }
      </template>
      <template v-for="item in hoveringSelections">
        .token.marked-code.{{ item }} {
          background: var(--hoveringbg);
          text-shadow: none;
        }
      </template>
      <template v-for="item in selectedSelections">
        .token.marked-code.{{ item }} {
          background: var(--selectedbg);
          text-shadow: none;
        }
      </template>
    </component>
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

@Component
export default class CompareSide extends Vue {
  @Prop({ required: true }) identifier!: string;
  @Prop({ required: true }) file!: File;
  @Prop({ required: true }) selections!: Array<Selection>;
  @Prop({ required: true }) hoveringSelections!: Array<string>;
  @Prop({ required: true }) activeSelections!: Array<string>;
  @Prop({ required: true }) selectedSelections!: Array<string>;

  get content(): string {
    return this.file.content;
  }

  get language(): string {
    return `language-${this.$store.state.data.metadata.language}`;
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
    this.emitLinesVisibleAmount();
    window.addEventListener("resize", this.emitLinesVisibleAmount);
  }

  destroyed(): void {
    window.removeEventListener("resize", this.emitLinesVisibleAmount);
  }

  emitLinesVisibleAmount(): void {
    this.$emit("linesvisibleamount", this.getLinesVisibleAmount());
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
    (this.$refs.pre as HTMLElement)
      .addEventListener("click", () => this.$emit("selectionclick", this.identifier, []));

    for (const value of document.querySelectorAll(`#${this.identifier} .marked-code`) as NodeListOf<HTMLElement>) {
      const filteredClassList = [...value.classList].filter(className => className.startsWith(ID_START));
      value.addEventListener("click", (ev: Event) => {
        this.$emit("selectionclick", this.identifier, filteredClassList);
        ev.stopPropagation();
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
@use 'variables';

.highlighted-code {
    height: var(--code-height);
    min-height: 100%;
    max-height: 100%;
    overflow-y: scroll;
    padding-top: 0 !important;

    .token {
      margin: -4px 0 -4px 0;
      padding: 4px 0 4px 0;
    }
}

pre.highlighted-code {
  margin-top: 0;

  code {
    padding-left: 0 !important;
  }
}

// /* hides the scrollbar */
//pre {
//  scrollbar-width: none; /* For Firefox */
//  -ms-overflow-style: none; /* For Internet Explorer and Edge */
//}
//
//pre::-webkit-scrollbar {
//  width: 0; /* For Chrome, Safari, and Opera */
//}

</style>
