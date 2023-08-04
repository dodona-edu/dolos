<template>
  <div ref="histogramElement"></div>
</template>

<script lang="ts" setup>
import { useFileStore } from "@/api/stores";
import { useD3Tooltip } from "@/composables";
import { useElementSize } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { computed, onMounted, shallowRef, watch } from "vue";
import { useRouter } from "vue-router";
import * as d3 from "d3";

interface Props {
  field: "similarity" | "longestFragment" | "totalOverlap";
  ticks: number;
  height?: number;
  width?: number;
  lineValue?: number;
  lineText?: string;
  calculateBinColor?: (x1: number, x2: number) => string;
}
const props = withDefaults(defineProps<Props>(), {});
const router = useRouter();
const { scoredFilesList } = storeToRefs(useFileStore());

// Data source for the bins of the histogram.
const binsData = computed(() =>
  scoredFilesList.value.map((score) => {
    if (props.field === "similarity") {
      return score.similarityScore?.similarity || 0;
    }
    if (props.field === "totalOverlap") {
      return score.totalOverlapScore?.totalOverlapWrtSize || 0;
    }
    if (props.field === "longestFragment") {
      return score.longestFragmentScore?.longestFragmentWrtSize || 0;
    }
    return 0;
  })
);

// Name of the field.
const fieldName = computed(() => {
  if (props.field === "similarity") {
    return "Similarity";
  }
  if (props.field === "totalOverlap") {
    return "Total Overlap";
  }
  if (props.field === "longestFragment") {
    return "Longest Fragment";
  }
  return "";
});

// Histogram template ref.
const histogramElement = shallowRef();

// Histogram element size
const margin = {
  top: 10,
  bottom: 55,
  left: 60,
  right: 45,
};
// Container size
const size = useElementSize(histogramElement);
// Width & height
const width = computed<number>(() => Math.max((props.width ?? size.width.value) - margin.left - margin.right, 0));
const height = computed<number>(() => Math.max((props.height ?? 400) - margin.top - margin.bottom, 0));

// Histogram D3
const histogramChart = d3.create("svg").attr("width", 900).attr("height", 200);
const histogramContent = histogramChart
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Tooltip
const tooltip = useD3Tooltip({ relativeToMouse: true });
const tooltipMessage = (d: any): string => {
  return `
    There are <b>${d.length}</b> submissions that have a
    highest similarity between <b>${d.x0}</b> and <b>${d.x1}</b>
  `;
};

const histogramXScale = shallowRef();
const histogramYScale = shallowRef();

// Draw the histogram.
const draw = (): void => {
  // Resize the histogram.
  histogramChart
    .attr("width", width.value + margin.left + margin.right)
    .attr("height", height.value + margin.top + margin.bottom);

  // Clear the histogram.
  histogramContent.selectAll("*").remove();

  // X-axis
  const x = d3.scaleLinear().domain([0, 1]).range([0, width.value]);
  histogramContent
    .append("g")
    .attr("transform", "translate(0," + height.value + ")")
    .call(d3.axisBottom(x).tickFormat(d3.format(".0%")))
    .classed("d3-ticks", true)
    .append("text")
    .text(fieldName.value)
    .classed("d3-label", true)
    .attr("transform", `translate(${width.value / 2}, 50)`);

  // X-ticks
  const xDomain = x.domain();
  const xTicks = x.ticks(props.ticks);
  const xTicksAjusted = xTicks[xTicks.length - 1] === xDomain[1] ? xTicks.slice(0, -1) : xTicks;

  // Histogram
  const histogram = d3.bin().domain([0, 1]).thresholds(xTicksAjusted);
  // Bins
  const bins = histogram(binsData.value);

  // Y-axis
  const y = d3
    .scaleLinear()
    .range([height.value, 0])
    .domain([0, d3.max<any, any>(bins, (d) => d.length)]);
  histogramContent
    .append("g")
    .call(d3.axisLeft(y))
    .classed("d3-ticks", true)
    .append("text")
    .text("Amount of files")
    .classed("d3-label", true)
    .attr("transform", `translate(-55, ${height.value / 2 + 35}) rotate(90)`);

  // Add the data.
  // Only add the data if there are any files available.
  if (binsData.value.length > 0) {
    histogramContent
      .selectAll("rect")
      .data(bins)
      .enter()
      .append("rect")
      .attr("x", 1)
      .attr(
        "transform",
        (d) => "translate(" + x(d.x0 ?? 0) + "," + y(d.length) + ")"
      )
      .attr("width", (d) => Math.max(0, x(d.x1 ?? 0) - x(d.x0 ?? 0) - 1))
      .attr("height", (d) => height.value - y(d.length))
      .style("fill", (d) => props.calculateBinColor?.(d.x0 ?? 0, d.x1 ?? 1) ?? "#1976D2")
      .style("cursor", "pointer")
      .on("mouseover", (e: MouseEvent, d) =>
        tooltip.onMouseOver(e, tooltipMessage(d))
      )
      .on("mousemove", (e: MouseEvent) => tooltip.onMouseMove(e))
      .on("mouseleave", (e: MouseEvent) => tooltip.onMouseOut(e))
      .on("click", (_: MouseEvent, d) => {
        const x0 = d.x0 ?? 0;
        const x1 = d.x1 ?? 1;

        // Go to the submissions page.
        router.push({
          name: "Submissions",
          query: {
            startSimilarity: x0.toString(),
            endSimilarity: x1.toString(),
          },
        });
      });
  }

  // Add hover line.
  const line = histogramChart
    .select("g")
    .append("line")
    .attr("x1", x(0.5))
    .attr("y1", 0)
    .attr("x2", x(0.5))
    .attr("y2", height.value)
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "3,3")
    .attr("pointer-events", "none")
    .attr("z-index", 2)
    .attr("visibility", "hidden");
  const lineNumber = histogramChart
    .select("g")
    .append("text")
    .classed("d3-ticks", true)
    .attr("x", x(0.5))
    .attr("y", 0)
    .attr("dy", "0.71em")
    .attr("visibility", "hidden");

  histogramChart.on("mouseenter", () => {
    line.attr("visibility", "visible");
    lineNumber.attr("visibility", "visible");
  });

  histogramChart.on("mousemove", (o) => {
    const xCoord = d3.pointer(o)[0] - margin.left;
    line.attr("x1", xCoord);
    line.attr("x2", xCoord);
    lineNumber.attr("x", xCoord + 8);
    lineNumber.text(`${(x.invert(xCoord) * 100).toFixed(0)}%`);

    // Hide if the x-coordinate is not between 0 and width.
    if (xCoord < 0 || xCoord > width.value) {
      line.attr("visibility", "hidden");
      lineNumber.attr("visibility", "hidden");
    } else {
      line.attr("visibility", "visible");
      lineNumber.attr("visibility", "visible");
    }
  });
  histogramChart.on("mouseleave", () => {
    line.attr("visibility", "hidden");
    lineNumber.attr("visibility", "hidden");
  });

  // Add line, if specified.
  if (props.lineValue) {
    // Line
    histogramChart
      .select("g")
      .append("line")
      .attr("class", "line")
      .attr("x1", x(props.lineValue))
      .attr("y1", 0)
      .attr("x2", x(props.lineValue))
      .attr("y2", height.value)
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("pointer-events", "none")
      .attr("z-index", 2);
    
    // Line text
    if (props.lineText) {
      histogramChart
        .select("g")
        .append("text")
        .attr("class", "line-text")
        .classed("d3-ticks", true)
        .attr("x", x(props.lineValue))
        .attr("y", 0)
        .attr("dy", "0.71em")
        .attr("dx", 8)
        .text(props.lineText);
    }
  }

  // Store the axis scales.
  histogramXScale.value = x;
  histogramYScale.value = y;
};

// Update the histogram when the width changes.
watch(width, () => draw());

// Update the histogram when the file data changes.
watch(binsData, () => draw());

// Update the histogram when the line value changes.
watch(() => props.lineValue, () => draw());

onMounted(() => {
  histogramElement.value?.prepend(histogramChart.node() ?? "");
  draw();
});
</script>
