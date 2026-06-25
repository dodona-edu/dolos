<template>
  <v-card variant="outlined">
    <v-card-title>Submissions in this cluster </v-card-title>

    <graph-element-list
      :cluster="props.cluster"
      :selected-files="props.selectedFiles"
      :max-height="props.maxHeight"
      :scroll="props.scroll"
      :clickable="props.clickable"
    />
  </v-card>
</template>

<script lang="ts" setup>
import { File } from "@/api/models";
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";

interface Props {
  cluster: Cluster;
  selectedFiles?: File[];
  maxHeight?: string;
  scroll?: boolean;
  clickable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {});
</script>

<style lang="scss" scoped>
.graph-list {
  max-height: v-bind("props.maxHeight");

  &-row {
    cursor: pointer;
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
