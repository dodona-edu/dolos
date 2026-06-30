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

