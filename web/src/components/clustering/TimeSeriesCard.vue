<template>
  <v-row>
    <v-col cols="4">
      <GraphElementList
        :cluster="props.cluster"
        :selected-files="files"
        max-height="400px"
        scroll
        @select-click="selectFile"
      />
    </v-col>

    <v-col cols="8">
      <TimeSeries
        :cluster="props.cluster"
        :selection="true"
        @filedata="setNewFiles"
        :selected-files="files"
      />
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import { shallowRef } from "vue";
import { File } from "@/api/models";
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import TimeSeries from "@/components/clustering/TimeSeries.vue";
import GraphElementList from "@/d3-tools/GraphElementList.vue";

interface Props {
  cluster: Cluster;
}

const props = withDefaults(defineProps<Props>(), {});

const files = shallowRef<File[]>([]);
const show = shallowRef(true);

const setNewFiles = (list: File[]): void => {
  show.value = list.every((f) => f.extra.timestamp);
  if (!show.value) {
    return;
  }
  files.value = list.sort(
    (a, b) => a.extra.timestamp?.valueOf() ?? 0 - b.extra.timestamp?.valueOf() ?? 0
  );
};

const selectFile = (file: File): void => {
  if (files.value.includes(file)) {
    files.value = files.value.filter((f) => f.id !== file.id);
  } else {
    files.value = [...files.value, file];
  }
};
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
