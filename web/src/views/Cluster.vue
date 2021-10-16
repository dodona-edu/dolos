<template>
  <div>
    <v-container fluid>
      <v-row justify="center">
        <v-col cols="10">
          <ClusteringTable
            :clustering="cluster"
            :loaded="dataLoaded"
            @cutoffChange="cutoffChange"
          />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import ClusteringTable from "@/components/ClusteringTable.vue";
import DataView from "@/views/DataView";
import { Clustering } from "@/util/clustering-algorithms/ClusterTypes";
import { singleLinkageCluster } from "@/util/clustering-algorithms/SingleLinkageClustering";

@Component({
  components: { ClusteringTable }
})
export default class Cluster extends DataView {
  public cutoff = 0.5;

  created(): Promise<void> {
    return super.ensureData();
  }

  get cluster(): Clustering {
    return singleLinkageCluster(super.pairs, super.files, this.cutoff);
  }

  cutoffChange(value: number): void {
    this.cutoff = value;
  }
}
</script>
