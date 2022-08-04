<template>
  <div ref="timeseriesElement">
    <GraphLegend :legend.sync="legendValue" />
  </div>
</template>

<script lang="ts" setup>
import {
  ref,
  shallowRef,
  watch,
  toRef,
  onMounted,
  onUnmounted,
} from "vue";
import { storeToRefs } from "pinia";
import { useApiStore } from "@/api/stores";
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import { File } from "@/api/models";
import { useCluster, useLegend } from "@/composables";
import { SelectionTool, xCoord } from "@/d3-tools/SelectionTool";
import GraphLegend from "@/d3-tools/GraphLegend.vue";
import * as d3 from "d3";

interface TimeDataType extends xCoord {
  file: File,
  y?: number
}

interface Props {
  cluster: Cluster;
  selection: boolean;
  selectedFiles: File[];
}

const props = withDefaults(defineProps<Props>(), {});
const emit = defineEmits(["filedata"]);

const { clusterFiles } = useCluster(toRef(props, "cluster"));
const { cutoffDebounced } = storeToRefs(useApiStore());
const legend = useLegend(clusterFiles);
const legendValue = ref(legend.value);

// Timeseries element size
const margin = {
  top: 10,
  bottom: 30,
  left: 60,
  right: 30,
};
const { width, height } = {
  width: 900 - margin.left - margin.right,
  height: 400 - margin.top - margin.bottom,
};

// Timeseries template ref.
const timeseriesElement = shallowRef();

// Timeseries D3
const timeseries = d3
  .create("svg")
  .attr("width", width)
  .attr("height", height);
const timeseriesContent = timeseries
  .append("g");

// Simulation
const simulation = shallowRef();

// Get the color for a file.
const getColor = (f: File): string => {
  return f.extra?.labels && legendValue.value
    ? legendValue.value[f.extra.labels].color
    : "#1976D2";
};

// Get the visibility of a file.
const getVisibility = (f: File): string => {
  return f.extra?.labels && legendValue.value
    ? legendValue.value[f.extra.labels].selected ? "visibile" : "hidden"
    : "visible";
};

// Draw the timeseries
const draw = (): void => {
  const elements = clusterFiles.value;
  const files = elements.map(file => ({ file }));

  // Resize the timeseries.
  timeseries
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);
  timeseriesContent
    .attr(
      "transform",
      "translate(" + margin.left + "," + margin.top + ")"
    );

  // Clear the timeseries.
  timeseriesContent.selectAll("*").remove();

  // Add the x-axis.
  const xScale = d3
    .scaleTime<number, number>()
    .domain(d3.extent(files.map(f => f.file.extra.timestamp!)) as [Date, Date])
    .range([0, width]);
  timeseriesContent
    .append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(xScale));

  // Add the data points
  timeseriesContent
    .selectAll("circle")
    .data(files)
    .enter()
    .append("circle")
    .attr("r", 6.5)
    .attr("cx", d => xScale(d.file.extra.timestamp!))
    .attr("cy", height / 2)
    .attr("fill", d => getColor((d.file)))
    .attr("visibility", d => getVisibility(d.file));

  // Add the selection tool (if enabled)
  if (props.selection) {
    // eslint-disable-next-line no-new
    new SelectionTool<TimeDataType>(
      timeseries as any,
      files,
      () => ({ height, width, margin }),
      (d: TimeDataType[]) => emit("filedata", d.map(f => f.file)),
    );
  }

  // Add simulation
  simulation.value = d3
    .forceSimulation<TimeDataType>(files)
    .force("x", d3.forceX<TimeDataType>(d => xScale(d?.file?.extra?.timestamp || new Date())).strength(1))
    .force("y", d3.forceY(height / 2))
    .force("collision", d3.forceCollide().radius(5).strength(0.1))
    .alpha(1)
    .on("tick", () =>
      d3
        .selectAll<d3.BaseType, TimeDataType>("circle")
        .attr("cx", (d: TimeDataType) => d?.x || 0)
        .attr("cy", (d: TimeDataType) => d?.y || 0)
    );
};

// Redraw the timeseries when the cluster changes.
watch(
  () => [cutoffDebounced.value, legendValue.value],
  () => {
    draw();
  }
);

// Update the internal legend object when the legend changes.
watch(
  () => legend.value,
  (legend) => {
    legendValue.value = legend;
  }
);

// Draw red circles around the selected files.
watch(
  () => props.selectedFiles,
  (selectedFiles) => {
    timeseriesContent
      .selectAll<any, TimeDataType>("circle")
      .style("stroke", d => d.file && selectedFiles.map(f => f.id).includes(d.file.id) ? "red" : "")
      .attr("r", d => d.file && selectedFiles.map(f => f.id).includes(d.file.id) ? 8.5 : 6.5);
  }
);

onMounted(() => {
  timeseriesElement.value?.prepend(timeseries.node() ?? "");
  draw();
});

onUnmounted(() => {
  simulation.value?.stop();
});
</script>
