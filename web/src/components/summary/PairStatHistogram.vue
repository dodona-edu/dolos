<template>
  <div ref="histogramElement" class="svg-container"></div>
</template>

<script lang="ts" setup>
import { shallowRef, computed, watch, onMounted } from "vue";
import { useD3Tooltip } from "@/composables";
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
  bottom: 30,
  left: 40,
  right: 30,
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

const histogramXScale = shallowRef();
const histogramYScale = shallowRef();

// Tooltip tool
const tooltip = useD3Tooltip({ relativeToTarget: true });

// Draw the histogram.
const draw = (): void => {
  // Resize the histogram.
  histogramChart
    .attr("width", width.value + margin.left + margin.right)
    .attr("height", height.value + margin.top + margin.bottom);

  // Clear the histogram.
  histogramContent.selectAll("*").remove();

  // Create the axes.
  const xScale = d3
    .scaleLinear()
    .domain([0, 1] as [number, number])
    .range([0, width.value]);
  const domain = xScale.domain();
  const ticks = xScale.ticks(props.ticks);
  const adjustedTicks = ticks[ticks.length - 1] === domain[1] ? ticks.slice(0, -1) : ticks;
  const histogram = d3
    .bin()
    .domain([0, 1])
    .thresholds(adjustedTicks);
  const bins = histogram(maxFileData.value);
  const yScale = d3
    .scaleLinear()
    .range([height.value, 0])
    .domain([
      0,
      d3.max<d3.Bin<number, number>, number>(bins, ({ length }) => length),
    ] as number[]);
  histogramContent
    .append("g")
    .attr("transform", "translate(0," + height.value + ")")
    .call(d3.axisBottom(xScale));
  histogramContent
    .append("g")
    .call(d3.axisLeft(yScale));

  histogramXScale.value = xScale;
  histogramYScale.value = yScale;

  // Add the data.
  histogramContent
    .selectAll("rect")
    .data<d3.Bin<number, number>>(bins)
    .enter()
    .append("rect")
    .attr("x", 1)
    .attr("transform", (d) => {
      return "translate(" + xScale(d.x0 || 0) + "," + yScale(d.length) + ")";
    })
    .attr("width", (d) => {
      return Math.max(xScale(d.x1 || 0) - xScale(d.x0 || 0) - 1, 0);
    })
    .attr("height", (d) => {
      return height.value - yScale(d.length);
    })
    .style("fill", d => getBinColor(d));

  // Add extra line, if specified.
  if (lineValue.value) {
    histogramContent
      .append("line")
      .attr("x1", xScale(lineValue.value))
      .attr("y1", 0)
      .attr("x2", xScale(lineValue.value))
      .attr("y2", height.value)
      .attr("stroke", "black");
  }

  // Add tooltip
  histogramChart
    .select("g")
    .selectAll("rect")
    .on("mouseover", (e: MouseEvent, d: any) => {
      const message = `There are <b>${d.length}</b> files
                      that have a ${fieldName.value.toLowerCase()} between 
                      <b>${d.x0}</b> and <b>${d.x1}</b>`;
      tooltip.onMouseOver(e, message);
    })
    .on("mousemove", (e: MouseEvent) => {
      tooltip.onMouseMove(e);
    })
    .on("mouseleave", (e: MouseEvent) => {
      tooltip.onMouseOut(e);
    });

  // Add hover line.
  const line = histogramChart
    .select("g")
    .insert("line", "rect")
    .attr("x1", xScale(0.5))
    .attr("y1", 0)
    .attr("x2", xScale(0.5))
    .attr("y2", height.value)
    .attr("stroke", "black")
    .attr("visibility", "hidden");
  const number = histogramChart.select("g")
    .append("text")
    .attr("x", xScale(0.5))
    .attr("y", height.value + 8)
    .attr("dy", "0.71em")
    .attr("font-size", 15)
    .attr("visibility", "hidden");

  histogramChart.on("mouseenter", () => {
    line.attr("visibility", "visible");
    number.attr("visibility", "visible");
  });
  histogramChart.on("mousemove", o => {
    const xCoord = d3.pointer(o)[0] - margin.left;
    line.attr("x1", xCoord);
    line.attr("x2", xCoord);
    number.attr("x", xCoord);
    number.text(xScale.invert(xCoord).toFixed(2));
  });
  histogramChart.on("mouseleave", () => {
    line.attr("visibility", "hidden");
    number.attr("visibility", "hidden");
  });
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
watch(
  width,
  () => {
    draw();
  },
);

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
