<template>
  <div class="timeseries" ref="timeseriesElement">
    <graph-legend v-model:legend="legend" readonly />
  </div>
</template>

<script lang="ts" setup>
import {
  shallowRef,
  watch,
  toRef,
  onMounted,
  onUnmounted,
  computed,
} from "vue";
import { storeToRefs } from "pinia";
import { useApiStore } from "@/api/stores";
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import { File } from "@/api/models";
import { useCluster, useD3Tooltip, usePartialLegend } from "@/composables";
import { SelectionTool, xCoord } from "@/util/SelectionTool";
import { useElementSize } from "@vueuse/core";
import * as d3 from "d3";
import { multiformat } from "@/util/TimeFormatter";

interface TimeDataType extends xCoord {
  file: File;
  y?: number;
}

interface Props {
  cluster: Cluster;
  selection?: boolean;
  selectedFiles?: File[];
  nodeTooltip?: boolean;
  nodeClickable?: boolean;
  nodeSize?: number;
  height?: number;
  width?: number;
}

const props = withDefaults(defineProps<Props>(), {
  nodeSize: 8,
});
const emit = defineEmits(["filedata", "click:node"]);

const { clusterFiles } = useCluster(toRef(props, "cluster"));
const { cutoffDebounced } = storeToRefs(useApiStore());
const legend = usePartialLegend(clusterFiles);

// Timeseries template ref.
const timeseriesElement = shallowRef();

// Timeseries element size
const margin = {
  top: 10,
  bottom: 50,
  left: 20,
  right: 100,
};
// Container size
const size = useElementSize(timeseriesElement);
// Width & height
const width = computed(
  () => (props.width ?? size.width.value) - margin.left - margin.right
);
const height = computed(
  () => (props.height ?? 300) - margin.top - margin.bottom
);

// Timeseries D3
const timeseries = d3.create("svg").attr("width", 900).attr("height", 200);
const timeseriesContent = timeseries.append("g");

// Selected outline

// Node cursor
const nodeCursor = computed(() =>
  props.nodeClickable ? "pointer" : "default"
);

// Node tooltip
const tooltip = useD3Tooltip({ relativeToMouse: true });

// Simulation
const simulation = shallowRef();

// Get the color for a file.
const getColor = (f: File): string => {
  return f.label.color;
};

// Get the visibility of a file.
const getVisibility = (f: File): string => {
  return f.label.selected ? "visibile" : "hidden";
};

// Draw the timeseries
const draw = (): void => {
  const elements = clusterFiles.value;
  const files = elements.map((file) => ({ file }));

  // Resize the timeseries.
  timeseries
    .attr("width", width.value + margin.left + margin.right)
    .attr("height", height.value + margin.top + margin.bottom);
  timeseriesContent.attr(
    "transform",
    "translate(" + margin.left + "," + margin.top + ")"
  );

  // Clear the timeseries.
  timeseriesContent.selectAll("*").remove();

  // Add the x-axis.
  const xScale = d3
    .scaleTime<number, number>()
    .domain(
      d3.extent(files.map((f) => f.file.extra.timestamp ?? new Date())) as [
        Date,
        Date
      ]
    )
    .range([0, width.value]);
  const xAxis = timeseriesContent
    .append("g")
    .attr("transform", `translate(0, ${height.value})`)
    .classed("d3-ticks", true)
    .call(d3.axisBottom(xScale).tickFormat((date) => multiformat(date)));
  xAxis
    .append("text")
    .text("Submission date")
    .classed("d3-label", true)
    .attr("transform", `translate(${width.value / 2}, 50)`);

  // Add the data points
  timeseriesContent
    .selectAll("circle")
    .data(files)
    .enter()
    .append("circle")
    .attr("id", (node: any) => `circle-${node.file.id}`)
    .classed("timeseries-node", true)
    .attr("r", props.nodeSize)
    .attr("cx", (d) => xScale(d.file.extra.timestamp ?? new Date()))
    .attr("cy", height.value / 2)
    .attr("fill", (d) => getColor(d.file))
    .attr("visibility", (d) => getVisibility(d.file))
    .on("mouseover", (e: MouseEvent, node: any) => {
      if (!props.nodeTooltip) return;
      tooltip.onMouseOver(
        e,
        node.file.extra.fullName ?? node.file.shortPath
      );
    })
    .on("mousemove", (e: MouseEvent) => {
      if (!props.nodeTooltip) return;
      tooltip.onMouseMove(e);
    })
    .on("mouseleave", (e: MouseEvent) => {
      if (!props.nodeTooltip) return;
      tooltip.onMouseOut(e);
    })
    .on("click", (e: MouseEvent, node: any) => {
      if (!props.nodeClickable) return;
      emit("click:node", node.file);
    });

  // Add the selection tool (if enabled)
  if (props.selection) {
    // eslint-disable-next-line no-new
    new SelectionTool<TimeDataType>(
      timeseries as any,
      files,
      () => ({ height: height.value, width: width.value, margin }),
      (d: TimeDataType[]) =>
        emit(
          "filedata",
          d.map((f) => f.file)
        )
    );
  }

  // Add simulation
  simulation.value = d3
    .forceSimulation<TimeDataType>(files)
    .force(
      "x",
      d3
        .forceX<TimeDataType>((d) =>
          xScale(d?.file?.extra?.timestamp || new Date())
        )
        .strength(1)
    )
    .force("y", d3.forceY(height.value / 2))
    .force("collision", d3.forceCollide().radius(5).strength(0.1))
    .alpha(1)
    .alphaMin(0.1)
    .on("tick", () => {
      d3.selectAll<d3.BaseType, TimeDataType>("circle")
        .attr("cx", (d: TimeDataType) => d?.x || 0)
        .attr("cy", (d: TimeDataType) => d?.y || 0);
    });

  drawSelected();
};

// Draw the selected files.
const drawSelected = (): void => {
  // Deselect all nodes.
  timeseriesContent.select(".selected").classed("selected", false);

  if (!props.selectedFiles) return;

  // Select the selected nodes.
  for (const file of props.selectedFiles) {
    timeseriesContent.select(`#circle-${file.id}`).classed("selected", true);
  }
};

// Redraw the timeseries when the cluster changes.
watch(
  () => [cutoffDebounced.value, legend.value],
  () => {
    draw();
  }
);

// Watch width changes & update the size.
watch(width, () => {
  draw();
});

// Draw red circles around the selected files.
watch(
  () => props.selectedFiles,
  () => {
    drawSelected();
  },
  { immediate: true }
);

onMounted(() => {
  timeseriesElement.value?.prepend(timeseries.node() ?? "");
  draw();
});

onUnmounted(() => {
  simulation.value?.stop();
});
</script>

<style lang="scss">
.timeseries {
  position: relative;

  &-node {
    cursor: v-bind("nodeCursor");

    &.selected {
      stroke: black;
      stroke-width: 3;
    }
  }
}
</style>
