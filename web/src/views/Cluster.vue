<template>
  <v-container fluid>
    <v-row justify="center">
      <v-col cols="10">
        <ClusteringTable :clustering="cluster" :loaded="dataLoaded" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import ClusteringTable from "@/components/ClusteringTable.vue";
import DataView from "@/views/DataView";
import { cluster, Clustering } from "@/util/Clustering";

@Component({
  components: { ClusteringTable }
})
export default class Cluster extends DataView {
  created(): Promise<void> {
    return super.ensureData();
  }

  get cluster(): Clustering {
    return cluster(super.pairs, super.files, 0.28);
  }
}
</script>
