<template>
  <div ref="listElement" class="fill-width" />
</template>

<script lang="ts" setup>
import {
  shallowRef,
  computed,
  watch,
  onMounted,
} from "vue";
import { useElementSize } from "@vueuse/core";
import { File } from "@/api/models";
import { useD3Tooltip } from "@/composables";
import * as d3 from "d3";

interface Props {
  currentFiles: File[];
}

const props = withDefaults(defineProps<Props>(), {});

// List template ref.
const listElement = shallowRef();

// List element size.
const listElementSize = useElementSize(listElement);
const width = computed(() => listElementSize.width.value ?? 40);
const height = computed(() => 35);

// Ideal width for each element.
const elementIdealWidth = 35;

// List D3
const list = d3.create("svg");
const listContent = list.append("g");
const listTooltip = useD3Tooltip({ relativeToMouse: true });

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
      `translate(${elementIdealWidth / 2}, ${((elementIdealWidth) / 2) + 1.5})`
    )
    .selectAll("g")
    .data(props.currentFiles)
    .enter()
    .append("g")
    .attr("transform", (_, i) => `translate(${scale(i)}, 0)`);

  // Add the avatars
  groups
    .append("circle")
    .attr("r", 16)
    .attr("fill", (file) => file.label.color);
  groups
    .append("text")
    .text((file) => {
      const name = file?.extra?.fullName ?? file.shortPath;
      const splitName = name.split(" ");
      if (splitName.length === 2) {
        return (splitName[0][0] + splitName[1][0]).toUpperCase();
      } else {
        return name[0].toUpperCase();
      }
    })
    .attr("stroke", "white")
    .attr("fill", "white")
    .attr("text-anchor", "middle")
    .attr("dy", "0.3em");

  groups.on("mouseover", (e: MouseEvent, file: File) => {
    listTooltip.onMouseOver(e, file.shortPath);
  });

  groups.on("mousemove", (e: MouseEvent) => {
    listTooltip.onMouseMove(e);
  });

  groups.on("mouseout", (e: MouseEvent) => {
    listTooltip.onMouseOut(e);
  });
};

// Update the list when the files change.
watch(() => props.currentFiles, () => draw());
// Update the list when the width changes.
watch(width, () => draw());

onMounted(() => {
  listElement.value?.prepend(list.node() ?? "");
  draw();
});
</script>
