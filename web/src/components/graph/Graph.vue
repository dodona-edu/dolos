<template>
  <div ref="container" class="graph-container">
    <!-- Extra (optional) UI elements can be added to this container  -->
    <slot />

    <!-- Options -->
    <div class="graph-options">
      <v-btn
          :color="graph.paused.value ? 'success' : 'warning'"
          text
          rounded
          @click="onPauseClick"
      >
        <template v-if="graph.paused.value">
          <v-icon left>mdi-play-outline</v-icon>
          Resume
        </template>

        <template v-else>
          <v-icon left>mdi-pause</v-icon>
          Pause
        </template>
      </v-btn>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  shallowRef,
  computed,
} from "vue";
import { useElementSize } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { File, Legend, Pair } from "@/api/models";
import { Cluster, Clustering } from "@/util/clustering-algorithms/ClusterTypes";
import { useD3ForceGraph } from "@/composables/d3/useD3ForceGraph";
import { useApiStore, useFileStore } from "@/api/stores";

interface Props {
  showSingletons?: boolean;
  polygon?: boolean;
  legend: Legend;
  clustering: Clustering;
  files: File[];
  pairs: Pair[];
  zoomTo?: string;
  selectedNode?: File | undefined;
  selectedCluster?: Cluster | undefined;
  width?: number;
  height?: number;
  nodeTooltip?: boolean;
  nodeClickable?: boolean;
  nodeSize?: number;
  maxEdges?: number;
}

const props = withDefaults(defineProps<Props>(), {
  nodeSize: 7,
  maxEdges: 5000,
});

const emit = defineEmits(["update:selectedNode", "update:selectedCluster", "click:node"]);


// Reference to the container element.
const container = shallowRef<HTMLElement>();
// Container size
const containerSize = useElementSize(container);
const width = computed<number>(() => props.width ?? containerSize.width.value);
const height = computed<number>(() => props.height ?? containerSize.height.value);

const fileStore = useFileStore();
const { cutoff, cutoffDebounced } = storeToRefs(useApiStore());


const graph = useD3ForceGraph({
  container: container,
  width: width,
  threshold: cutoffDebounced,
  height: height,
  nodeSize: props.nodeSize,
  maxEdges: props.maxEdges,
});

graph.update(props.files, props.pairs);

// Pause the simulation
const onPauseClick = (): void => {
  graph.paused.value = !graph.paused.value;
};

</script>

<style lang="scss">
.graph-container {
  width: 100%;
  height: 100%;
  position: relative;

  svg {
    width: 100%;
    height: 100%;
    z-index: 1;

    #arrow-marker {
      stroke: #666;
      fill: transparent;
      stroke-linecap: round;
    }

    .node {
      stroke-linecap: round;

      &.source {
        // TODO:
      }

      &.selected {
        stroke: black;
        stroke-width: 3;
      }

      &:hover {
        cursor: v-bind("graphNodeCursor");
      }
    }

    .link {
      stroke: #999;
      opacity: 0.6;
      &.directed {
        marker-mid: url(#arrow-marker);
      }
      &:hover {
        cursor: pointer;
      }
    }
  }
}

.graph {
  &-options {
    position: absolute;
    z-index: 2;
    bottom: 1rem;
    left: 0;
  }
}
</style>
