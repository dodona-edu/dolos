<template>
  <div>
    <div class="d-flex flex-row justify-space-around align-center" v-if="show">
      <div class="d-flex gel-items">
        <GraphElementList
          :cluster="cluster"
          :selected-files="files"
          :scroll="true"
          @select-click="selectFile"
        >
        </GraphElementList>
      </div>
      <div class="graph-wrapper flex-grow-1">
        <TimeSeriesDiagram
          :cluster="cluster"
          :selection="true"
          @filedata="setNewFiles"
          :selected-files="files"
        />
      </div>
    </div>
    <div v-if="show" class="more-info">
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-icon v-bind="attrs" v-on="on"> mdi-information </v-icon>
        </template>
        <span class="tooltip-span">
          The timeline representation places each of the files in this cluster
          on the timeline, allowing you to see suspicious activity based on the
          handin times (such as many people copying at the last minute). You can
          select files by clicking and dragging on the timeline, or selecting
          the files in the file list.
        </span>
      </v-tooltip>
    </div>
    <div v-if="!show">
      <p>
        Your files do not all include a timestamp. The time series card is
        unavailable.
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, shallowRef } from "@vue/composition-api";
import { File } from "@/api/models";
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import TimeSeriesDiagram from "@/components/clustering/TimeSeries.vue";
import GraphElementList from "@/d3-tools/GraphElementList.vue";

export default defineComponent({
  props: {
    cluster: {
      type: Object as PropType<Cluster>,
      required: true,
    },
  },

  setup() {
    const files = ref<File[]>([]);
    const show = shallowRef(true);

    const setNewFiles = (list: File[]): void => {
      show.value = list.every((f) => f.extra.timestamp);
      if (!show.value) {
        return;
      }
      files.value = list.sort(
        (a, b) => a.extra.timestamp!.valueOf() - b.extra.timestamp!.valueOf()
      );
    };

    const selectFile = (file: File): void => {
      if (files.value.includes(file)) {
        files.value = files.value.filter((f) => f.id !== file.id);
      } else {
        files.value = [...files.value, file];
      }
    };

    return {
      files,
      show,
      setNewFiles,
      selectFile,
    };
  },

  components: {
    TimeSeriesDiagram,
    GraphElementList,
  }
});
</script>

<style>
.fileInfoContainer {
  min-height: 100px;
  width: 80%;
}
.user-card {
  margin: 5px;
}

.gel-items {
  max-height: 375px;
}

.more-info {
  position: absolute;
  right: 80px;
  top: 0;
}

.tooltip-span {
  display: block;
  max-width: 400px;
}

.graph-wrapper {
  width: 80%;
}
</style>
