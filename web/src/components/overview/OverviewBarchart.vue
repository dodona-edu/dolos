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
import { useFileStore } from "@/api/stores";
import { useElementSize } from "@vueuse/core";
import { TooltipTool } from "@/d3-tools/TooltipTool";
import * as d3 from "d3";

interface Props {
  numberOfTicks?: number;
  extraLine?: number;
  pairField?: "similarity" | "longestFragment" | "totalOverlap";
}

const props = withDefaults(defineProps<Props>(), {
  pairField: "similarity",
});

const { similaritiesList } = storeToRefs(useFileStore());
const maxFileData = computed(() =>
  similaritiesList.value.map(f => f?.similarity || 0)
);

const getBinColor = (): string => {
  return "#1976D2";
};

// Barchart template ref.
const barchartElement = shallowRef();

// Barchart element size
const margin = {
  top: 10,
  bottom: 60,
  left: 70,
  right: 70,
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

const barchartXScale = shallowRef();
const barchartYScale = shallowRef();

// Draw the barchart.
const draw = (): void => {
  // Resize the barchart.
  barchart
    .attr("width", width.value + margin.left + margin.right)
    .attr("height", height.value + margin.top + margin.bottom);

  // Clear the barchart.
  barchartContent.selectAll("*").remove();

  // Create the axes.
  const xScale = d3
    .scaleLinear()
    .domain([0, 1] as [number, number])
    .range([0, height.value]);
  const domain = xScale.domain();
  const ticks = xScale.ticks(props.numberOfTicks);
  const adjustedTicks = ticks[ticks.length - 1] === domain[1] ? ticks.slice(0, -1) : ticks;
  const histogram = d3.bin().domain([0, 1]).thresholds(adjustedTicks);
  const bins = histogram(maxFileData.value);
  const yScale = d3
    .scaleLinear()
    .range([0, width.value])
    .domain([
      0,
      d3.max<d3.Bin<number, number>, number>(bins, ({ length }) => length),
    ] as number[]);

  barchartXScale.value = xScale;
  barchartYScale.value = yScale;

  const xAxis = barchartContent
    .append("g")
    .attr("transform", "translate(0, " + height.value + ")")
    .call(d3.axisBottom(yScale));
  xAxis
    .append("text")
    .text("Amount of pairs")
    .attr("font-size", 15)
    .attr("fill", "black")
    .attr("transform", `translate(${width.value / 2}, 35)`);

  const yAxis = barchartContent
    .append("g")
    .attr("transform", "translate(0, 0)")
    .call(d3.axisLeft(xScale).tickFormat(d3.format(".0%")));
  yAxis.append("text")
    .text("Similarity")
    .attr("font-size", 15)
    .attr("fill", "black")
    .attr("transform", `translate(-50, ${height.value / 2 + 35}) rotate(90)`);

  // Add the data.
  barchartContent
    .selectAll("rect")
    .data(bins)
    .enter()
    .append("rect")
    .attr("x", 0)
    .attr("transform", (d) => {
      return "translate(" + 0 + "," + xScale(d.x0 || 0) + ")";
    })
    .attr("height", (d) => {
      return xScale(d.x1 || 0) - xScale(d.x0 || 0) - 1;
    })
    .attr("width", (d) => {
      return yScale(d.length);
    })
    .style("fill", () => getBinColor());

  // Add extra line, if specified.
  if (props.extraLine) {
    barchartContent
      .append("line")
      .attr("class", "extra-line")
      .attr("x1", 0)
      .attr("y1", xScale(props.extraLine))
      .attr("x2", width.value)
      .attr("y2", xScale(props.extraLine))
      .attr("stroke", "black");
  }

  // Add tooltip
  const tool = new TooltipTool<d3.Bin<number, number>>(h => `
    There are <b>${h.length}</b> files that have a value between <b>${h.x0}</b> and <b>${h.x1}</b>
  `);
  barchart
    .select("g")
    .selectAll("rect")
    .on("mouseenter", (e, d) =>
      tool.mouseEnter(e, d as d3.Bin<number, number>, true))
    .on("mouseleave", () => tool.mouseOut());
};

// Update the extra line when the value changes.
watch(
  () => props.extraLine,
  (extraLine) => {
    barchartContent
      .select(".extra-line")
      .attr("y1", barchartXScale.value(extraLine))
      .attr("y2", barchartXScale.value(extraLine));
  }
);

// Update the barchart when the width changes.
watch(width, () => draw());

// Update the barchart when the file data changes.
watch(maxFileData, () => draw());

onMounted(() => {
  barchartElement.value?.prepend(barchart.node() ?? "");
  draw();
});
</script>
