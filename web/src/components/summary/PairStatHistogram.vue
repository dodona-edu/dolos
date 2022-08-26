<template>
  <div ref="histogramElement" class="svg-container"></div>
</template>

<script lang="ts" setup>
import { shallowRef, computed, watch, onMounted } from "vue";
import { useD3Tooltip, useRouter } from "@/composables";
import { useElementSize } from "@vueuse/core";
import { useFileStore } from "@/api/stores";
import { File } from "@/api/models";
import { storeToRefs } from "pinia";
import * as d3 from "d3";
import { getLargestFieldOfScore } from "@/util/FileInterestingness";

interface Props {
  field: "similarity" | "longestFragment" | "totalOverlap";
  file: File;
  ticks: number;
  height?: number;
  width?: number;
}

const props = withDefaults(defineProps<Props>(), {});
const router = useRouter();
const { scoredFiles, scoredFilesList } = storeToRefs(useFileStore());

const maxFileData = computed(() =>
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

// Field name
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

// Line for the file
const lineValue = computed(() => {
  const score = scoredFiles.value.get(props.file);
  if (!score) return null;

  const field = getLargestFieldOfScore(score);
  if (!field) return null;

  const pair = field === "similarity"
    ? score.similarityScore?.pair
    : field === "totalOverlap"
      ? score.totalOverlapScore?.pair
      : score.longestFragmentScore?.pair;

  if (!pair) return null;

  if (props.field === "totalOverlap") {
    const covered =
      props.file.id === pair?.leftFile.id
        ? pair.leftCovered
        : pair?.rightCovered;
    return (covered ?? 0) / props.file.amountOfKgrams;
  }

  if (props.field === "longestFragment") {
    return (pair?.longestFragment ?? 0) / props.file.amountOfKgrams;
  }
  if (props.field === "similarity") {
    return pair?.similarity ?? 0;
  }

  return null;
});

const getBinColor = (d: d3.Bin<number, number>): string => {
  const defaultColor = "#1976D2";
  const warningColor = "#ff5252";

  if (
    lineValue.value &&
    (d.x0 || 0) < lineValue.value &&
    (d.x1 || 0) >= lineValue.value
  ) {
    return warningColor;
  }

  return defaultColor;
};

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
const width = computed(() => Math.max((props.width ?? size.width.value) - margin.left - margin.right, 0));
const height = computed(() => (props.height ?? 400) - margin.top - margin.bottom);

// Histogram D3
const histogramChart = d3
  .create("svg")
  .attr("width", 900)
  .attr("height", 200);
const histogramContent = histogramChart
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Tooltip
const tooltip = useD3Tooltip({ relativeToMouse: true });
const tooltipMessage = (d): string => {
  return `There are <b>${d.length}</b> files that have a value between <b>${d.x0}</b> and <b>${d.x1}</b>`;
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
  const x = d3
    .scaleLinear()
    .domain([0, 1])
    .range([0, width.value]);
  const xAxis = histogramContent
    .append("g")
    .attr("transform", "translate(0," + height.value + ")")
    .call(d3.axisBottom(x).tickFormat(d3.format(".0%")))
    .classed("d3-ticks", true);
  xAxis
    .append("text")
    .text(fieldName.value)
    .classed("d3-label", true)
    .attr("transform", `translate(${width.value / 2}, 50)`);

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
    .domain([0, d3.max<any, any>(bins, d => d.length)]);
  const yAxis = histogramContent
    .append("g")
    .call(d3.axisLeft(y))
    .classed("d3-ticks", true);
  yAxis
    .append("text")
    .text("Amount of files")
    .classed("d3-label", true)
    .attr("transform", `translate(-55, ${height.value / 2 + 35}) rotate(90)`);

  // Add the data.
  // Only add the data if there are any files available.
  if (maxFileData.value.length > 0) {
    histogramContent
      .selectAll("rect")
      .data(bins)
      .enter()
      .append("rect")
      .attr("x", 1)
      .attr("transform", (d) => "translate(" + (x(d.x0 ?? 0)) + "," + y(d.length) + ")")
      .attr("width", (d) => x(d.x1 ?? 0) - x(d.x0 ?? 0) - 1)
      .attr("height", (d) => height.value - y(d.length))
      .style("fill", (d) => getBinColor(d))
      .style("cursor", "pointer")
      .on("mouseover", (e: MouseEvent, d) => tooltip.onMouseOver(e, tooltipMessage(d)))
      .on("mousemove", (e: MouseEvent) => tooltip.onMouseMove(e))
      .on("mouseleave", (e: MouseEvent) => tooltip.onMouseOut(e))
      .on("click", (_: MouseEvent, d) => {
        const x0 = d.x0 ?? 0;
        const x1 = d.x1 ?? 1;

        // Go to the submissions page.
        router.push({
          path: "/submissions",
          query: {
            startSimilarity: x0.toString(),
            endSimilarity: x1.toString(),
          },
        });
      });
  }

  // Add extra line, if specified.
  if (lineValue.value) {
    histogramContent
      .append("line")
      .attr("x1", x(lineValue.value))
      .attr("y1", 0)
      .attr("x2", x(lineValue.value))
      .attr("y2", height.value)
      .attr("stroke", "black");
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
    .attr("z-index", 2)
    .attr("visibility", "hidden");
  const number = histogramChart.select("g")
    .append("text")
    .classed("d3-ticks", true)
    .attr("x", x(0.5))
    .attr("y", 0)
    .attr("dy", "0.71em")
    .attr("visibility", "hidden");

  histogramChart.on("mouseenter", () => {
    line.attr("visibility", "visible");
    number.attr("visibility", "visible");
  });
  histogramChart.on("mousemove", o => {
    const xCoord = d3.pointer(o)[0] - margin.left;
    line.attr("x1", xCoord);
    line.attr("x2", xCoord);
    number.attr("x", xCoord + 8);
    number.text(`${(x.invert(xCoord) * 100).toFixed(0)}%`);

    // Hide if the x-coordinate is not between 0 and width.
    if (xCoord < 0 || xCoord > width.value) {
      line.attr("visibility", "hidden");
      number.attr("visibility", "hidden");
    } else {
      line.attr("visibility", "visible");
      number.attr("visibility", "visible");
    }
  });
  histogramChart.on("mouseleave", () => {
    line.attr("visibility", "hidden");
    number.attr("visibility", "hidden");
  });

  // Store the axis scales.
  histogramXScale.value = x;
  histogramYScale.value = y;
};

// Update the extra line when the value changes.
watch(
  () => lineValue.value,
  (extraLine) => {
    histogramContent
      .select(".extra-line")
      .attr("y1", histogramXScale.value(extraLine))
      .attr("y2", histogramXScale.value(extraLine));
  }
);

// Update the histogram when the width changes.
watch(width, () => draw());

// Update the histogram when the file data changes.
watch(maxFileData, () => draw());

onMounted(() => {
  histogramElement.value?.prepend(histogramChart.node() ?? "");
  draw();
});
</script>

<style scoped>
.svg-container {
  max-height: 500px;
}
</style>
