<template>
  <div ref="barchartElement"></div>
</template>

<script lang="ts" setup>
import {
  shallowRef,
  computed,
  watch,
  onMounted,
} from "vue";
import { storeToRefs } from "pinia";
import { useApiStore, useFileStore } from "@/api/stores";
import { useElementSize } from "@vueuse/core";
import * as d3 from "d3";
import { useD3Tooltip } from "@/composables";

interface Props {
  ticks?: number;
  extraLine?: number;
  pairField?: "similarity" | "longestFragment" | "totalOverlap";
}

const props = withDefaults(defineProps<Props>(), {
  ticks: 20,
  pairField: "similarity",
});

const { cutoff } = storeToRefs(useApiStore());
const { similaritiesList } = storeToRefs(useFileStore());
const maxFileData = computed(() =>
  similaritiesList.value.map(f => f?.similarity || 0)
);

// Barchart template ref.
const barchartElement = shallowRef();

// Barchart element size
const margin = {
  top: 10,
  bottom: 40,
  left: 45,
  right: 45,
};
const barchartSize = useElementSize(barchartElement);
const width = computed(() => (barchartSize.width.value || 600) - margin.left - margin.right);
const height = computed(() => 415 - margin.top - margin.bottom);

// Barchart D3
const barchart = d3
  .create("svg");
const barchartContent = barchart
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Tooltip
const tooltip = useD3Tooltip({ relativeToMouse: true });
const tooltipMessage = (d): string => {
  return `There are <b>${d.length}</b> files that have a value between <b>${d.x0}</b> and <b>${d.x1}</b>`;
};

const barchartXScale = shallowRef();
const barchartYScale = shallowRef();

// Determin the color of a given bin.
const getBinColor = (d): string => {
  // If the x1 coordinate is below the threshold return an greyed out color.
  // x1 represents the end value of the bin.
  return d.x1 <= cutoff.value ? "grey" : "#1976D2";
};

// Draw the barchart.
const draw = (): void => {
  // Resize the barchart.
  barchart
    .attr("width", width.value + margin.left + margin.right)
    .attr("height", height.value + margin.top + margin.bottom);

  // Clear the barchart.
  barchartContent.selectAll("*").remove();

  // X-axis
  const x = d3
    .scaleLinear()
    .domain([0, 1])
    .range([0, width.value]);
  barchartContent.append("g")
    .attr("transform", "translate(0," + height.value + ")")
    .call(d3.axisBottom(x).tickFormat(d3.format(".0%")));

  // X-ticks
  const xDomain = x.domain();
  const xTicks = x.ticks(props.ticks);
  const xTicksAjusted = xTicks[xTicks.length - 1] === xDomain[1] ? xTicks.slice(0, -1) : xTicks;

  // Histogram
  const histogram = d3
    .bin()
    .domain([0, 1])
    .thresholds(xTicksAjusted);
  // Bins
  const bins = histogram(maxFileData.value);
  
  // Y-axis
  const y = d3
    .scaleLinear()
    .range([height.value, 0])
    .domain([0, d3.max(bins, d => d.length)]);
  barchartContent.append("g")
    .call(d3.axisLeft(y));

  // Add the data.
  barchartContent
    .selectAll("rect")
    .data(bins)
    .enter()
    .append("rect")
    .attr("x", 1)
    .attr("transform", (d) => "translate(" + (x(d.x0 ?? 0)) + "," + y(d.length) + ")")
    .attr("width", (d) => x(d.x1 ?? 0) - x(d.x0 ?? 0) - 1)
    .attr("height", (d) => height.value - y(d.length))
    .style("fill", (d) => getBinColor(d))
    .on("mouseover", (e: MouseEvent, d) => tooltip.onMouseOver(e, tooltipMessage(d)))
    .on("mousemove", (e: MouseEvent) => tooltip.onMouseMove(e))
    .on("mouseleave", (e: MouseEvent) => tooltip.onMouseOut(e));

  // Add extra line, if specified.
  if (props.extraLine) {
    barchartContent
      .append("line")
      .attr("class", "extra-line")
      .attr("x1", x(props.extraLine))
      .attr("y1", 0)
      .attr("x2", x(props.extraLine))
      .attr("y2", height.value)
      .attr("stroke", "black");
  }

  // Store the axis scales.
  barchartXScale.value = x;
  barchartYScale.value = y;
};

// Update the extra line when the value changes.
watch(
  () => props.extraLine,
  (extraLine) => {
    barchartContent
      .select(".extra-line")
      .attr("x1", barchartXScale.value(extraLine))
      .attr("x2", barchartXScale.value(extraLine));
  }
);

// Update the barchart when the width changes.
watch(width, () => draw());

// Update the barchart when the file data changes.
watch(maxFileData, () => draw());

// Update the barchart when the cutoff changes.
watch(cutoff, () => {
  barchart
    .select("g")
    .selectAll("rect")
    .style("fill", (d) => getBinColor(d));
});

onMounted(() => {
  barchartElement.value?.prepend(barchart.node() ?? "");
  draw();
});
</script>
