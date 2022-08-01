<template>
  <div>
    <div class="d-flex flex-column align-center flex-grow flex-nowrap mt-4">
      <v-alert
        color="#1976D2"
        v-if="!hoveredPair"
        class="extra-info-container"
        type="info"
      >
        Hover over a pair to see extra data.
      </v-alert>

      <v-alert
        v-if="!!hoveredPair"
        color="#1976D2"
        class="extra-info-container"
        type="info"
      >
        <span>Similarity: {{ hoveredPair.similarity.toFixed(2) }}</span>
        <span>Longest fragment: {{ hoveredPair.longestFragment }}</span>
        <span>Common overlap: {{ hoveredPair.totalOverlap }}</span>
      </v-alert>
      <div class="d-flex flex-row justify-space-around fullwidth">
        <div class="gel-list">
          <GraphElementList
            :selected-files="selectedFiles"
            :cluster="cluster"
          />
        </div>
        <div class="d-flex">
          <div ref="heatmapElement" class="svg-container"></div>
          <div ref="heatmapLegendElement"></div>
        </div>
      </div>
    </div>
    <div class="more-info">
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-icon v-bind="attrs" v-on="on"> mdi-information </v-icon>
        </template>
        <span class="tooltip-span">
          The heatmap visualizes the details of each of the pairs of files in
          this cluster. You can use this to examine the connections between the
          files in detail. This can be useful in particular for identifying
          files which do not belong in the cluster, when certain rows and
          columns are colored too light. You can use this to modify the cutoff
          value.
        </span>
      </v-tooltip>
    </div>
  </div>
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
import { storeToRefs } from "pinia";
import { useFileStore, usePairStore, useApiStore } from "@/api/stores";
import { useCluster, useRouter } from "@/composables";
import { Pair, File } from "@/api/models";
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import { pairsAsNestedMap } from "@/util/PairAsNestedMap";
import GraphElementList from "@/d3-tools/GraphElementList.vue";
import * as d3 from "d3";

export default defineComponent({
  props: {
    cluster: {
      type: Set as PropType<Cluster>,
      required: true,
    },
  },

  setup(props) {
    const { files } = storeToRefs(useFileStore());
    const { cutoff, cutoffDebounced } = storeToRefs(useApiStore());
    const { pairsList } = storeToRefs(usePairStore());
    const { clusterFiles } = useCluster(toRef(props, "cluster"));
    const router = useRouter();

    // List of selected files.
    const selectedFiles = shallowRef<File[]>([]);

    // Pair that is being hovered in the heatmap.
    const hoveredPair = shallowRef<Pair | null>(null);

    // Heatmap element & legend template ref.
    const heatmapElement = shallowRef<SVGSVGElement>();
    const heatmapLegendElement = shallowRef<SVGSVGElement>();

    // Heatmap element size
    const { width, height } = {
      width: 450,
      height: 450,
    };

    // Heatmap D3
    const heatmap = d3.create("svg").attr("width", width).attr("height", height);
    const heatmapContent = heatmap.append("g");

    // Heatmap legend D3
    const heatmapLegend = d3
      .create("svg")
      .attr("width", 50)
      .attr("height", 300);
    const heatmapLegendContent = heatmapLegend
      .append("g")
      .attr("transform", "rotate(-90) translate(-205, 0)");

    // Nested pairs map
    const pairMap = computed(() => pairsAsNestedMap(pairsList.value));

    // Get a pair for 2 given files.
    const getPair = (file1: File, file2: File): Pair | null => {
      return pairMap.value.get(file1.id)?.get(file2.id) || null;
    };

    // Draw the heatmap
    const draw = (): void => {
      const elements = clusterFiles.value;
      const margin = {
        top: 0,
        bottom: 50,
        left: 125,
        right: 30,
      };

      // Resize the heatmap.
      heatmap
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);
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
        .range([0, width])
        .domain(elements.map((d) => d.id).reverse())
        .padding(0.01);
      const yBand = d3
        .scaleBand<number>()
        .range([height, 0])
        .domain(elements.map((d) => d.id))
        .padding(0.01);
      const xAxis = d3
        .axisBottom(xBand)
        .tickFormat(
          (d) =>
            `${files.value[d].extra.fullName ?? files.value[d].shortPath}`
        );
      const yAxis = d3
        .axisLeft(yBand)
        .tickFormat(
          (d) =>
            `${files.value[d].extra.fullName ?? files.value[d].shortPath}`
        );

      // Append the axes to the heatmap.
      heatmapContent
        .append("g")
        .attr("transform", "translate(0," + height + ")")
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

      const legendAxis = d3
        .axisBottom(legendScale)
        .tickValues([cutoff.value, 1]);

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
        .attr("font-size", 15)
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
        .on("mouseout", onMouseLeave);
    };

    // Add the SVG for the heatmap to the container.
    onMounted(() => {
      heatmapElement.value?.prepend(heatmap.node() ?? "");
      heatmapLegendElement.value?.prepend(heatmapLegend.node() ?? "");
      draw();
    });

    // Redraw the heatmap when the cluster changes.
    watch(
      () => cutoffDebounced.value,
      () => {
        draw();
      }
    );

    // When the user hovers over a square in the heatmap.
    const onMouseOver = (e: MouseEvent, [first, second]: [File, File]): void => {
      const pair = getPair(first, second);
      if (!pair) return;

      selectedFiles.value = [first, second];
      hoveredPair.value = pair;

      if (e.target) {
        d3
          .select(e.target as any)
          .classed("heatmap-tile--hover", true);
      }
    };

    // When the user stops hovering over a square in the heatmap.
    const onMouseLeave = (e: MouseEvent): void => {
      selectedFiles.value = [];
      hoveredPair.value = null;

      if (e.target) {
        d3
          .select(e.target as any)
          .classed("heatmap-tile--hover", false);
      }
    };

    // When the user clicks on a square in the heatmap.
    const onClick = (_: unknown, [first, second]: [File, File]): void => {
      const pair = getPair(first, second);

      if (pair) {
        router.push(`/compare/${pair.id}`);
      }
    };

    return {
      heatmapElement,
      heatmapLegendElement,
      heatmap,
      selectedFiles,
      hoveredPair,
    };
  },

  components: {
    GraphElementList,
  },
});
</script>

<style scoped>
div {
  pointer-events: auto;
}

.svg-container {
  display: flex;
  flex-direction: row;
  justify-content: center;
  min-width: 400px;
}

.extra-info-container {
  min-width: 400px;
  width: 60%;
  color: white;
}

.gel-list {
  min-width: 400px;
  max-height: 570px;
}

.fullwidth {
  width: 100%;
}
</style>

non-scoped style for svg styles
<style>
.extra-info-container * * {
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  text-align: center;
}

.more-info {
  position: absolute;
  left: 0;
  top: 0;
}

.tooltip-span {
  display: block;
  max-width: 400px;
}

.heatmap-tile {
  cursor: pointer;
  transition: background-color 400ms ease;
}
</style>
