<template>
  <v-container fluid>
    <v-row justify="center">
      <v-col cols="10">
        <ClusteringTable :clustering="clustering" :loaded="dataLoaded" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import ClusteringTable from "@/components/ClusteringTable.vue";
import DataView from "@/views/DataView";

@Component({
  components: { ClusteringTable }
})
export default class Cluster extends DataView {
  created(): Promise<void> {
    return super.ensureData();
  }
}
</script>
