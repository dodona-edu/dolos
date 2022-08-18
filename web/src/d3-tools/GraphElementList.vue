<template>
  <v-simple-table class="graph-list" fixed-header>
    <thead>
      <tr>
        <th>File</th>
        <th v-if="hasTimestamp">Timestamp</th>
      </tr>
    </thead>

    <tbody class="graph-list-body">
      <tr
        v-for="file in files"
        :key="file.id"
        :id="`file-${file.id}`"
        class="graph-list-row"
        :class="{ selected: selectedFiles?.includes(file) }"
        @click="rowClick(file)"
      >
        <td class="d-flex align-center">
          <label-dot
            :legend="legend"
            :file="file"
          />

          <span class="ml-2">{{ file.extra.fullName ?? file.shortPath }}</span>
        </td>

        <td v-if="hasTimestamp">
          <file-timestamp :file="file" />
        </td>
      </tr>
    </tbody>
  </v-simple-table>
</template>

<script lang="ts" setup>
import { computed, watch } from "vue";
import { File } from "@/api/models";
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import { getClusterElementsArray } from "@/util/clustering-algorithms/ClusterFunctions";
import { timestampSort } from "@/util/SortingFunctions";
import { useFileStore } from "@/api/stores";
import { storeToRefs } from "pinia";
import { useVuetify } from "@/composables";
import LabelDot from "@/components/LabelDot.vue";
import FileTimestamp from "@/components/FileTimestamp.vue";

interface Props {
  cluster: Cluster;
  selectedFiles?: File[];
  maxHeight?: string;
  scroll?: boolean;
  clickable?: boolean;
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

// Row cursor
const rowCursor = computed(() => {
  return props.clickable ? "pointer" : "default";
});

// When a row is clicked.
const rowClick = (file: File): void => {
  emit("select-click", file);
};

watch(
  () => props.selectedFiles,
  () => {
    if (props.selectedFiles && props.selectedFiles.length > 0 && props.scroll) {
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
    cursor: v-bind("rowCursor");
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
</style>
