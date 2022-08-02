<template>
  <v-card elevation="2" outlined class="graph-element-list">
    <v-card-title> Files in this cluster </v-card-title>

    <v-card-text>
      <v-simple-table>
        <template v-slot:default>
          <thead>
            <tr>
              <th></th>
              <th class="text-left">Name</th>
              <th class="text-left">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="element in elements"
              :key="element.id"
              :id="`element-${element.id}`"
              @click="rowClick(element)"
              v-bind:class="{ selected: selectedFiles.includes(element) }"
            >
              <td>
                <v-tooltip top>
                  <template v-slot:activator="{ on, attrs }">
                    <span
                      class="tiny-color"
                      :style="`background-color: ${getColor(element)}`"
                      v-bind="attrs"
                      v-on="on"
                    ></span>
                  </template>
                  <span>{{ element.extra.labels || "No label" }}</span>
                </v-tooltip>
              </td>
              <td>{{ element.shortPath }}</td>
              <td>
                <v-tooltip top>
                  <template v-slot:activator="{ on, attrs }">
                    <span class="short-timestamp" v-bind="attrs" v-on="on">{{
                      formatTime(element.extra.timestamp)
                    }}</span>
                  </template>

                  {{ formatTimeLong(element.extra.timestamp) }}
                </v-tooltip>
              </td>
            </tr>
          </tbody>
        </template>
      </v-simple-table>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, watch } from "vue";
import { File } from "@/api/models";
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import { getClusterElementsArray } from "@/util/clustering-algorithms/ClusterFunctions";
import { DateTime } from "luxon";
import { booleanSort, chainSort, reverseSort, timestampSort } from "@/util/SortingFunctions";
import { useFileStore } from "@/api/stores";
import { storeToRefs } from "pinia";
import { useVuetify } from "@/composables";

export default defineComponent({
  props: {
    cluster: {
      type: Set as PropType<Cluster>,
      required: true
    },
    selectedFiles: {
      type: Array as PropType<File[]>,
      default: () => []
    },
    sortBySelected: {
      type: Boolean as PropType<boolean>,
      default: false
    },
    scroll: {
      type: Boolean as PropType<boolean>,
      default: false
    },
  },

  setup(props, { emit }) {
    const vuetify = useVuetify();
    const { legend } = storeToRefs(useFileStore());
    const elements = computed(() => {
      const sortBySelectedFunction = chainSort<File>(
        reverseSort(booleanSort(f => props.selectedFiles.includes(f))),
        timestampSort(f => f.extra.timestamp || new Date())
      );
      const sortByTimestampFunction = timestampSort<File>(f => f.extra.timestamp || new Date());
      return getClusterElementsArray(props.cluster)
        .sort(props.sortBySelected ? sortBySelectedFunction : sortByTimestampFunction);
    });

    const formatTime = (time: Date): string => {
      if (!time) { return ""; }
      return DateTime.fromJSDate(time).toLocaleString();
    };

    const formatTimeLong = (time: Date): string => {
      if (!time) { return ""; }
      return DateTime.fromJSDate(time).toLocaleString(DateTime.DATETIME_MED);
    };

    const getColor = (file: File): string => {
      if (!legend.value || !file.extra.labels || !legend.value[file.extra.labels]) return "";
      return legend.value[file.extra.labels].color;
    };

    const rowClick = (file: File): void => {
      emit("select-click", file);
    };

    watch(
      () => props.selectedFiles,
      () => {
        if (props.selectedFiles.length > 0 && props.scroll) {
          const element = props.selectedFiles[0];
          vuetify.goTo(`#element-${element.id}`, { container: ".graph-element-list" });
        }
      }
    );

    return {
      elements,
      formatTime,
      formatTimeLong,
      getColor,
      rowClick,
    };
  },
});
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
