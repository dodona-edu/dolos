<template>
  <div class="d-flex">
    <div ref="heatmapElement" class="svg-container"></div>
    <div ref="heatmapLegendElement"></div>
  </div>
</template>

<script lang="ts" setup>
import { shallowRef, computed, watch, onMounted, toRef } from "vue";
import { storeToRefs } from "pinia";
import { useFileStore, usePairStore, useApiStore } from "@/api/stores";
import { useCluster, useD3Tooltip } from "@/composables";
import { Pair, File } from "@/api/models";
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import { pairsAsNestedMap } from "@/util/PairAsNestedMap";
import * as d3 from "d3";
import { useElementSize } from "@vueuse/core";
import { useRouter } from "vue-router";

interface Props {
  cluster: Cluster;
  height?: number;
  width?: number;
}

const props = withDefaults(defineProps<Props>(), {});
const router = useRouter();
const { filesActiveById } = storeToRefs(useFileStore());
const { cutoff, cutoffDebounced } = storeToRefs(useApiStore());
const { pairsActiveList } = storeToRefs(usePairStore());
const { clusterFiles } = useCluster(toRef(props, "cluster"));

// List of selected files.
const selectedFiles = shallowRef<File[]>([]);

// Pair that is being hovered in the heatmap.
const hoveredPair = shallowRef<Pair | null>(null);

// Heatmap element & legend template ref.
const heatmapElement = shallowRef<SVGSVGElement>();
const heatmapLegendElement = shallowRef<SVGSVGElement>();

const margin = {
  top: 0,
  bottom: 80,
  left: 125,
  right: 30,
};
// Container size
const size = useElementSize(heatmapElement);
// Width & height
const width = computed(() =>
  Math.max(0, (props.width ?? size.width.value) - margin.left - margin.right)
);
const height = computed(
  () => (props.height ?? 450) - margin.top - margin.bottom
);

// Heatmap D3
const heatmap = d3
  .create("svg")
  .attr("width", width.value)
  .attr("height", height.value);
const heatmapContent = heatmap.append("g");
const heatmapTooltip = useD3Tooltip({ relativeToMouse: true });

// Heatmap legend D3
const heatmapLegend = d3.create("svg").attr("width", 50).attr("height", 300);
const heatmapLegendContent = heatmapLegend
  .append("g")
  .attr("transform", "rotate(-90) translate(-205, 0)");

// Nested pairs map
const pairMap = computed(() => pairsAsNestedMap(pairsActiveList.value));

// Get a pair for 2 given files.
const getPair = (file1: File, file2: File): Pair | null => {
  return pairMap.value.get(file1.id)?.get(file2.id) || null;
};

// Draw the heatmap
const draw = (): void => {
  const elements = clusterFiles.value;

  // Resize the heatmap.
  heatmap
    .attr("width", width.value + margin.left + margin.right)
    .attr("height", height.value + margin.top + margin.bottom);
  heatmapContent.attr(
    "transform",
    `translate(${margin.left}, ${margin.top / 2})`
  );

  // Clear the heatmap.
  heatmapContent.selectAll("*").remove();
  heatmapLegendContent.selectAll("*").remove();

  // Create the axes.
  const xBand = d3
    .scaleBand<number>()
    .range([0, width.value])
    .domain(elements.map((d) => d.id).reverse())
    .padding(0.01);
  const yBand = d3
    .scaleBand<number>()
    .range([height.value, 0])
    .domain(elements.map((d) => d.id))
    .padding(0.01);
  const xAxis = d3
    .axisBottom(xBand)
    .tickFormat(
      (d) =>
        `${
          filesActiveById.value[d].extra.fullName ??
          filesActiveById.value[d].shortPath
        }`
    );
  const yAxis = d3
    .axisLeft(yBand)
    .tickFormat(
      (d) =>
        `${
          filesActiveById.value[d].extra.fullName ??
          filesActiveById.value[d].shortPath
        }`
    );

  // Append the axes to the heatmap.
  heatmapContent
    .append("g")
    .attr("transform", "translate(0," + height.value + ")")
    .call(xAxis)
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-35)");
  heatmapContent.append("g").call(yAxis);

  // Setup the color scale & legend.
  const scale = ["#e6f2ff", "#1976D2"];
  const colorScale = d3
    .scaleLinear<string, number>()
    .domain([cutoff.value, 1])
    .range(scale);

  const gradient = heatmapLegendContent
    .append("defs")
    .append("linearGradient")
    .attr("id", "gradient")
    .attr("x1", "0%") // bottom
    .attr("y1", "0%")
    .attr("x2", "100%") // to top
    .attr("y2", "0%")
    .attr("spreadMethod", "pad");

  gradient
    .append("stop")
    .attr("offset", "0%")
    .attr("stop-color", scale[0])
    .attr("stop-opacity", 1);

  gradient
    .append("stop")
    .attr("offset", "100%")
    .attr("stop-color", scale[1])
    .attr("stop-opacity", 1);

  heatmapLegendContent
    .append("rect")
    .attr("x1", 150)
    .attr("y1", 0)
    .attr("width", 200)
    .attr("height", 25)
    .style("fill", "url(#gradient)");

  const legendScale = d3
    .scaleLinear()
    .domain([cutoff.value, 1])
    .range([0, 200]);

  const legendAxis = d3.axisBottom(legendScale).tickValues([cutoff.value, 1]);

  heatmapLegendContent
    .append("g")
    .attr("class", "legend axis")
    .attr("transform", "translate(0, 30)")
    .call(legendAxis);

  heatmapLegendContent
    .append("text")
    .attr("class", "x label")
    .attr("text-anchor", "end")
    .attr("x", 175)
    .attr("y", 50)
    .text("Similarity cutoff value");

  // Setup the data
  const pairs = d3.cross(elements, elements.reverse());

  // Setup the heatmap.
  heatmapContent
    .selectAll()
    .data(pairs)
    .enter()
    .append("rect")
    .attr("x", ([first]) => xBand(first.id) || 0)
    .attr("y", ([, second]) => yBand(second.id) || 0)
    .attr("width", xBand.bandwidth())
    .attr("height", yBand.bandwidth())
    .attr(
      "x-content",
      ([first, second]) => getPair(first, second)?.similarity || 1
    )
    .attr("class", "heatmap-tile")
    .style("fill", ([first, second]) =>
      colorScale(getPair(first, second)?.similarity || 1)
    )
    .on("click", onClick)
    .on("mouseover", onMouseOver)
    .on("mousemove", onMouseMove)
    .on("mouseout", onMouseOut);
};

// Add the SVG for the heatmap to the container.
onMounted(() => {
  heatmapElement.value?.prepend(heatmap.node() ?? "");
  heatmapLegendElement.value?.prepend(heatmapLegend.node() ?? "");
  draw();
});

// Redraw the heatmap when the cluster changes.
watch(cutoffDebounced, () => draw());

// Redraw the heatmap when the cluster changes.
watch(clusterFiles, () => draw());

// Redraw the heatmap when the width changes.
watch(width, () => draw());

// When the user hovers over a square in the heatmap.
const onMouseOver = (e: MouseEvent, [first, second]: [File, File]): void => {
  if (e.target) {
    d3.select(e.target as any).classed("heatmap-tile--hover", true);
  }

  const pair = getPair(first, second);
  if (!pair) return;

  selectedFiles.value = [first, second];
  hoveredPair.value = pair;

  // Show the tooltip
  heatmapTooltip.onMouseOver(
    e,
    `
    <span>${first.extra.fullName ?? first.shortPath} &</span>
    <span>${second.extra.fullName ?? second.shortPath}</span>
    <span>(Similarity: ${(pair.similarity * 100).toFixed(0)}%)</span>
  `
  );
};

// When the user moves the mouse.
const onMouseMove = (e: MouseEvent): void => {
  // Move the tooltip
  heatmapTooltip.onMouseMove(e);
};

// When the user stops hovering over a square in the heatmap.
const onMouseOut = (e: MouseEvent): void => {
  selectedFiles.value = [];
  hoveredPair.value = null;

  if (e.target) {
    d3.select(e.target as any).classed("heatmap-tile--hover", false);
  }

  // Hide the tooltip
  heatmapTooltip.onMouseOut(e);
};

// When the user clicks on a square in the heatmap.
const onClick = (_: unknown, [first, second]: [File, File]): void => {
  const pair = getPair(first, second);

  if (pair) {
    router.push({ name: "Pair", params: { pairId: String(pair.id) } });
  }
};
</script>

<style lang="scss" scoped>
.svg-container {
  display: flex;
  flex-direction: row;
  justify-content: center;
  width: 100%;
}

:deep(.heatmap-tile) {
  cursor: pointer;
}

:deep(.heatmap-tile--hover) {
  stroke: black;
  stroke-width: 2px;
}
</style>
