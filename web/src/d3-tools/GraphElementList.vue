<template>
  <v-card outlined>
    <v-card-title> Files in this cluster </v-card-title>

    <v-simple-table class="graph-list" fixed-header>
      <thead>
        <tr>
          <th>File</th>
          <th v-if="hasTimestamp">Timestamp</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="file in files"
          :key="file.id"
          :id="`file-${file.id}`"
          class="graph-list-row"
          :class="{ selected: selectedFiles.includes(file) }"
          @click="rowClick(file)"
        >
          <td class="d-flex align-center">
            <v-tooltip top>
              <template #activator="{ on, attrs }">
                <span
                  class="graph-list-row-label"
                  :style="`background-color: ${getColor(file)}`"
                  v-bind="attrs"
                  v-on="on"
                />
              </template>
              <span>{{ file.extra.labels || "No label" }}</span>
            </v-tooltip>

            <span class="ml-2">{{ file.shortPath }}</span>
          </td>

          <td v-if="hasTimestamp">
            <v-tooltip top>
              <template #activator="{ on, attrs }">
                <span class="short-timestamp" v-bind="attrs" v-on="on">
                  {{ formatTime(file.extra.timestamp)}}
                </span>
              </template>

              {{ formatTimeLong(file.extra.timestamp) }}
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
import { timestampSort } from "@/util/SortingFunctions";
import { useFileStore } from "@/api/stores";
import { storeToRefs } from "pinia";
import { useVuetify } from "@/composables";

interface Props {
  cluster: Cluster;
  selectedFiles: File[];
  maxHeight?: string;
  scroll?: boolean;
}

const props = withDefaults(defineProps<Props>(), {});
const emit = defineEmits(["select-click"]);
const vuetify = useVuetify();
const { legend } = storeToRefs(useFileStore());

// List of files in the cluster.
// Sorted by timestamp.
const files = computed(() => {
  return getClusterElementsArray(props.cluster).sort(timestampSort<File>(
    (f) => f.extra.timestamp || new Date()
  ));
});

// If the timestamp is available for the elements of the cluster.
const hasTimestamp = computed(() => {
  return files.value.some((f) => f.extra.timestamp);
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
      const file = props.selectedFiles[0];
      vuetify.goTo(`#file-${file.id}`, {
        container: ".graph-list-body",
      });
    }
  }
);
</script>

<style lang="scss" scoped>
.graph-list {
  max-height: v-bind("props.maxHeight");

  &-row {
    transition: background-color 0.15s ease;

    &.selected {
      background-color: #f0f0f0;
    }

    &-label {
      background-color: grey;
      width: 10px;
      height: 10px;
      display: block;
      border-radius: 50%;
    }
  }
}

.short-timestamp {
  text-decoration: underline dotted;
}

// Fix scrolling when overflowing with sticky header.
:deep(.v-data-table) {
  overflow: auto;

  .v-data-table__wrapper {
    overflow: unset;
  }
}
</style>
