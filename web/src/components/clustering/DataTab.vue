<template>
  <div>
    <div class="d-flex justify-space-between">
      <div>
        <div class="d-flex">
          <v-icon>mdi-chevron-right</v-icon>
          <h3>Statistics</h3>
        </div>
        <ul>
          <v-list-item>
            <v-list-item-title>
              <v-icon>mdi-menu-right</v-icon>

              <b>Size: </b>
              {{ getClusterElements(cluster).size }}
            </v-list-item-title>
          </v-list-item>
          <v-list-item>
            <v-list-item-title>
              <v-icon>mdi-menu-right</v-icon>

              <b>Average Similarity: </b>
              {{ averageSimilarity(cluster) }}
            </v-list-item-title>
          </v-list-item>
        </ul>
      </div>

    </div>
    <div class="d-flex">
      <v-icon>mdi-chevron-right</v-icon>
      <h3>Files</h3>
    </div>
    <ul class="d-flex flex-wrap justify-space-between">
      <v-list-item
        v-for="item in getClusterElements(cluster)"
        :key="item.id"
        class="file-element"
      >
        <v-icon>mdi-menu-right</v-icon>

        <v-list-item-title>{{
          item.path.split("/").slice(-2).join("/")
        }}</v-list-item-title>
      </v-list-item>
    </ul>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import {
  getAverageClusterSimilarity,
  getClusterElements,
} from "@/util/clustering-algorithms/ClusterFunctions";
import { File } from "@/api/api";
import HeatMap from "./HeatMap.vue";

@Component({ components: { HeatMap } })
export default class DataTab extends Vue {
  @Prop() cluster!: Cluster;
  @Prop() cutoff!: number;

  averageSimilarity(cluster: Cluster): string {
    return getAverageClusterSimilarity(cluster).toFixed(2);
  }

  getClusterElements(cluster: Cluster): Set<File> {
    return getClusterElements(cluster);
  }
}
</script>
<style>
.file-element {
  flex: 0 1 calc(33% - 20px);
}
</style>
