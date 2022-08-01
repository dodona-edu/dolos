<template>
  <div ref="listElement" class="svg-container" />
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  shallowRef,
  computed,
  watch,
  onMounted,
  toRef,
} from "vue";
import { useElementSize } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { useFileStore } from "@/api/stores";
import { File, Legend } from "@/api/models";
import { TooltipTool } from "@/d3-tools/TooltipTool";
import * as d3 from "d3";

type SVGSelection = d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>;
type WidthScale = d3.ScaleLinear<number, number>;

export default defineComponent({
  props: {
    currentFiles: {
      type: Array as PropType<File[]>,
      required: true,
    },
  },

  setup(props) {
    const { legend } = storeToRefs(useFileStore());

    // List template ref.
    const listElement = shallowRef();

    // List element size.
    const listElementSize = useElementSize(listElement);
    const width = computed(() => listElementSize.width.value || 870);
    const height = computed(() => 40);

    // Ideal width for each element.
    const elementIdealWidth = 45;
    // Margin between elements.
    const elementMargin = 8;

    // List D3
    const list = d3.create("svg");
    const listContent = list.append("g");

    // List tooltip tool
    const listToolTipTool = new TooltipTool<File>(file => {
      if (file.extra.fullName) return file.extra.fullName;
      return file.shortPath;
    });

    // Draw the list.
    const draw = (): void => {
      // Resize the list.
      list.attr("width", width.value).attr("height", height.value);

      // Clear the list.
      listContent.selectAll("*").remove();

      // Create the scale.
      const widthNoOverlap = elementIdealWidth * props.currentFiles.length;
      const actualWidth = Math.min(widthNoOverlap, width.value - elementIdealWidth);

      const scale = d3
        .scaleLinear()
        .domain([0, props.currentFiles.length])
        .range([0, actualWidth]);

      // Create the groups.
      const groups = listContent
        .attr(
          "transform",
          `translate(${elementIdealWidth / 2}, ${((elementIdealWidth - elementMargin) / 2) + 1.5})`
        )
        .selectAll("g")
        .data(props.currentFiles)
        .enter()
        .append("g")
        .attr("transform", (_, i) => `translate(${scale(i)}, 0)`);

      // Add the avatars
      groups
        .append("circle")
        .attr("r", 20)
        .attr("fill", (file) => file.extra.labels ? legend.value[file.extra.labels].color : "blue");
      groups
        .append("text")
        .text((file) => {
          if (file.extra.fullName) {
            const splitName = file.extra.fullName.split(" ");
            if (splitName.length === 2) {
              return (splitName[0][0] + splitName[1][0]).toUpperCase();
            } else {
              return file.extra.fullName[0].toUpperCase();
            }
          } else {
            const path = file.shortPath;
            return path[path.length - 1][0].toUpperCase();
          }
        })
        .attr("stroke", "white")
        .attr("fill", "white")
        .attr("text-anchor", "middle")
        .attr("dy", "0.3em");

      groups.on("mouseenter", (e: MouseEvent, file: File) => {
        d3.select(e.target as any).raise();
        listToolTipTool.mouseEnter(e, file);
      });

      groups.on("mouseleave", () => {
        listToolTipTool.mouseOut();
      });
    };

    // Update the list when the files change.
    watch(
      () => props.currentFiles,
      () => {
        draw();
      }
    );

    // Update the list when the width changes.
    watch(
      () => [width.value],
      () => {
        draw();
      }
    );

    onMounted(() => {
      listElement.value?.prepend(list.node() ?? "");
      draw();
    });

    return {
      listElement,
    };
  },
});
</script>

<style>
.svg-container {
  width: 100%;
}
</style>
