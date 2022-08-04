<template>
  <v-card outlined class="graph-element-list">
    <v-card-title> Files in this cluster </v-card-title>

    <v-simple-table>
      <thead>
        <tr>
          <th>File</th>
          <th v-if="hasTimestamp">Timestamp</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="element in elements"
          :key="element.id"
          :id="`element-${element.id}`"
          :class="{ selected: selectedFiles.includes(element) }"
          @click="rowClick(element)"
        >
          <td class="d-flex align-center">
            <v-tooltip top>
              <template v-slot:activator="{ on, attrs }">
                <span
                  class="tiny-color"
                  :style="`background-color: ${getColor(element)}`"
                  v-bind="attrs"
                  v-on="on"
                />
              </template>
              <span>{{ element.extra.labels || "No label" }}</span>
            </v-tooltip>

            <span class="ml-2">{{ element.shortPath }}</span>
          </td>

          <td v-if="hasTimestamp">
            <v-tooltip top>
              <template v-slot:activator="{ on, attrs }">
                <span class="short-timestamp" v-bind="attrs" v-on="on">
                  {{ formatTime(element.extra.timestamp)}}
                </span>
              </template>

              {{ formatTimeLong(element.extra.timestamp) }}
            </v-tooltip>
          </td>
        </tr>
      </tbody>
    </v-simple-table>
  </v-card>
</template>

<script lang="ts" setup>
import { computed, watch } from "vue";
import { File } from "@/api/models";
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import { getClusterElementsArray } from "@/util/clustering-algorithms/ClusterFunctions";
import { DateTime } from "luxon";
import {
  booleanSort,
  chainSort,
  reverseSort,
  timestampSort,
} from "@/util/SortingFunctions";
import { useFileStore } from "@/api/stores";
import { storeToRefs } from "pinia";
import { useVuetify } from "@/composables";

interface Props {
  cluster: Cluster;
  selectedFiles: File[];
  sortBySelected?: boolean;
  scroll?: boolean;
}

const props = withDefaults(defineProps<Props>(), {});
const emit = defineEmits(["select-click"]);
const vuetify = useVuetify();
const { legend } = storeToRefs(useFileStore());

const elements = computed(() => {
  const sortBySelectedFunction = chainSort<File>(
    reverseSort(booleanSort((f) => props.selectedFiles.includes(f))),
    timestampSort((f) => f.extra.timestamp || new Date())
  );
  const sortByTimestampFunction = timestampSort<File>(
    (f) => f.extra.timestamp || new Date()
  );
  return getClusterElementsArray(props.cluster).sort(
    props.sortBySelected ? sortBySelectedFunction : sortByTimestampFunction
  );
});

// If the timestamp is available for the elements of the cluster.
const hasTimestamp = computed(() => {
  return elements.value.some((f) => f.extra.timestamp);
});

const formatTime = (time?: Date): string => {
  if (!time) return "";
  return DateTime.fromJSDate(time).toLocaleString();
};

const formatTimeLong = (time?: Date): string => {
  if (!time) return "";
  return DateTime.fromJSDate(time).toLocaleString(DateTime.DATETIME_MED);
};

// Get the label color for a file in the cluster.
const getColor = (file: File): string => {
  if (!legend.value || !file.extra.labels || !legend.value[file.extra.labels]) return "";
  return legend.value[file.extra.labels].color;
};

// When a row is clicked.
const rowClick = (file: File): void => {
  emit("select-click", file);
};

watch(
  () => props.selectedFiles,
  () => {
    if (props.selectedFiles.length > 0 && props.scroll) {
      const element = props.selectedFiles[0];
      vuetify.goTo(`#element-${element.id}`, {
        container: ".graph-element-list",
      });
    }
  }
);
</script>

<style scoped lang="scss">
.graph-element-list {
  max-width: 500px;
  max-height: 100%;
  overflow: auto;
  z-index: 5;
}

.active {
  background-color: darkgray;
}

.element {
  text-align: center;
  border-radius: 10px;
  margin: 5px;
  padding: 5px;
}

.tiny-color {
  background-color: grey;
  width: 10px;
  height: 10px;
  display: block;
  border-radius: 50%;
}

.selected {
  background-color: #f0f0f0;
}

.short-timestamp {
  text-decoration: underline dotted;
}
</style>
