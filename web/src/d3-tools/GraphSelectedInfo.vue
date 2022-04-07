<template>
<div class="selected-info">
  <div v-if="selectedNodeInfo.info && !selectedCluster">
    <v-card elevation="2" outlined>
      <v-card-title>
        Selected node
      </v-card-title>

      <v-card-text>
        The author of this submission is <b>{{selectedNodeInfo.info.name || "unknown"}}</b>, belonging to group
        <b>{{selectedNodeInfo.info.label}}</b>. The last hand-in date was <b>{{selectedNodeInfo.info.timestamp}}</b>.
      </v-card-text>
    </v-card>
  </div>
  <div v-if="selectedCluster">
    <v-card elevation="2" outlined>
      <v-card-title>
        Selected cluster
      </v-card-title>

      <v-card-text>
        You selected a cluster of size <b>{{getClusterElements(selectedCluster).size}}</b>, which has an average
        similarity of  <b>{{getAverageClusterSimilarity(selectedCluster).toFixed(2) * 100}}%</b>.
        You can investigate this cluster further by following the link below.
      </v-card-text>
      <v-card-actions>
      <v-btn color="success" text>More information</v-btn>
      </v-card-actions>
    </v-card>

  </div>
</div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import { File } from "@/api/api";
import * as d3 from "d3";
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import { SelectedNodeInfo } from "@/views/GraphView.vue";
import { getAverageClusterSimilarity, getClusterElements } from "@/util/clustering-algorithms/ClusterFunctions";

@Component({})
export default class GraphSelectedInfo extends Vue {
  @Prop() selectedNodeInfo!: SelectedNodeInfo;
  @Prop() selectedCluster! : Cluster | null;

  getClusterElements = getClusterElements

  getAverageClusterSimilarity = getAverageClusterSimilarity
}
</script>
<style>
.selected-info {
  max-width: 350px;
  position: absolute;
  z-index: 5;
}
</style>
