<template>
  <div>
    <v-container fluid>
      <v-row justify="center">
        <v-col cols="10">
          <ClusteringTable :clustering="cluster" :loaded="dataLoaded" :cutoff="cutoff"/>
        </v-col>
      </v-row>
      <v-row justify="end">
        <v-col cols="3">
          <form>
            <label>
              Similarity ≥ {{ cutoff }}<br />
              <input
                type="range"
                min="0.25"
                max="1"
                step="0.01"
                v-model="cutoff"
              />
            </label>
          </form>
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
  public cutoff = 0.25;

  created(): Promise<void> {
    return super.ensureData();
  }

  get cluster(): Clustering {
    return singleLinkageCluster(super.pairs, super.files, this.cutoff);
  }
}
</script>
