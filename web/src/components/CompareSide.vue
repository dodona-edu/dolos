<template>
  <div class="code-container fill-height">
    <component :is="'style'" type="text/css">
      <template v-for="item in activeSelections">
        .token.marked-code.{{ item }} {
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
    <pre
      v-scroll.self="onScroll"
      ref="pre"
      :id="identifier"
      class="line-numbers highlighted-code"
      :data-start="startRow"
    ><code
      ref="codeblock" :class="`language-${language}`"></code>
    </pre>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  computed,
  watch,
  onMounted,
  onUnmounted,
} from "@vue/composition-api";
import { Selection, File } from "@/api/models";
import {
  ID_START,
  registerFragmentHighlighting,
} from "@/util/OccurenceHighlight";
import { NodeStats } from "@dodona/dolos-lib";

import Prism from "prismjs";
import "prismjs/themes/prism.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.js";
import "prismjs/plugins/line-numbers/prism-line-numbers.css";

export default defineComponent({
  props: {
    identifier: {
      type: String as PropType<string>,
      required: true,
    },

    file: {
      type: Object as PropType<File>,
      required: true,
    },

    language: {
      type: String as PropType<string>,
      required: true,
    },

    selections: {
      type: Array as PropType<Selection[]>,
      required: true,
    },

    hoveringSelections: {
      type: Array as PropType<string[]>,
      required: true,
    },

    activeSelections: {
      type: Array as PropType<string[]>,
      required: true,
    },

    selectedSelections: {
      type: Array as PropType<string[]>,
      required: true,
    },

    semanticMatches: {
      type: Array as PropType<NodeStats[]>,
      required: true,
    },

    startRow: {
      type: Number as PropType<number>,
      default: 0,
    },

    endRow: {
      type: Number as PropType<number>,
      default: undefined,
    },
  },

  setup(props, { emit, refs }) {
    const content = computed(() =>
      props.file.content
        .split("\n")
        .slice(props.startRow, props.endRow)
        .join("\n")
    );

    const onScroll = (e: Event): void => {
      const scrollTop = (e.target as HTMLElement)?.scrollTop;
      const maxScroll = (e.target as HTMLElement).getBoundingClientRect()
        .height;
      const temp = (e.target as HTMLElement).clientHeight;
      emit(
        "codescroll",
        props.identifier,
        Math.min(1, scrollTop / (maxScroll - temp))
      );
    };

    // Returns an approximation of the amount of visible lines if all lines where filled in.
    const getLinesVisibleAmount = (): number => {
      const lineNumber = document.querySelector(
        ".line-numbers-rows :first-child"
      );
      if (!lineNumber) {
        return 0;
      }
      const height = (refs.pre as HTMLElement).getBoundingClientRect().height;
      return height / lineNumber.getBoundingClientRect().height;
    };

    const installLanguage = async (): Promise<void> => {
      const currentLanguage = props.language.toLowerCase();
      if (Prism.languages[currentLanguage]) {
        return;
      }
      await require("prismjs/components/prism-" + currentLanguage);
    };

    const addEventListeners = (): void => {
      (refs.pre as HTMLElement)
        .addEventListener("click", () => emit("selectionclick", props.identifier, []));

      for (const value of document.querySelectorAll(`#${props.identifier} .marked-code`)) {
        const filteredClassList = [...value.classList].filter(className => className.startsWith(ID_START));
        value.addEventListener("click", (ev: Event) => {
          emit("selectionclick", props.identifier, filteredClassList);
          ev.stopPropagation();
        });

        value.addEventListener("mouseout", () => {
          emit("selectionhoverexit", props.identifier, filteredClassList);
        });

        value.addEventListener("mouseover", () => {
          emit("selectionhoverenter", props.identifier, filteredClassList);
        });
      }
    };

    const codeHighlight = (): void => {
      const codeblock = refs.codeblock as Element;
      codeblock.textContent = content.value;
      Prism.highlightElement(codeblock, false);
      addEventListeners();
    };

    const emitLinesVisibleAmount = (): void => {
      emit("linesvisible", props.identifier, getLinesVisibleAmount());
    };

    const highlight = async (): Promise<void> => {
      await installLanguage();
      registerFragmentHighlighting(props.selections);
      codeHighlight();
    };

    watch(
      () => props.file.content,
      () => {
        highlight();
      }
    );

    onMounted(() => {
      // This timeout is needed to assure that the highlight function works. If this is not done then the first time
      // component is loaded, the kmers will not be properly highlighted. This is probably due to the `Prism.hooks.add`
      // call in OccurrenceHighlight#registerFragmentHighlighting happening too early.
      setTimeout(async () => {
        await highlight();
      }, 50);
      emitLinesVisibleAmount();
      window.addEventListener("resize", emitLinesVisibleAmount);
    });

    onUnmounted(() => {
      window.removeEventListener("resize", emitLinesVisibleAmount);
    });

    return {
      content,
      onScroll,
    };
  },
});
</script>

<style lang="scss">
@use "variables";

.highlighted-code {
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

.code-container {
  code {
    background-color: unset !important;
  }
}
</style>
