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
      </v-card-text>
      <v-card-text class="namecontainer">
        These files are present in the cluster:
        <ul>
          <li v-for="el of getClusterElements(selectedCluster)" :key="el.id">
            {{el.path.split("/").slice(-2).join("/")}}
          </li>
        </ul>
      </v-card-text>
      <v-card-actions>
      <v-btn color="success" text @click="goToInfo">More information</v-btn>
      </v-card-actions>
    </v-card>

  </div>
</div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Cluster, Clustering } from "@/util/clustering-algorithms/ClusterTypes";
import { SelectedNodeInfo } from "@/views/GraphView.vue";
import { getAverageClusterSimilarity, getClusterElements } from "@/util/clustering-algorithms/ClusterFunctions";

@Component({})
export default class GraphSelectedInfo extends Vue {
  @Prop() selectedNodeInfo!: SelectedNodeInfo;
  @Prop() selectedCluster! : Cluster | null;
  @Prop() currentClustering!: Clustering;

  getClusterElements = getClusterElements

  getAverageClusterSimilarity = getAverageClusterSimilarity

  getClusterIndex(): number {
    const sortf = (a: Cluster, b:Cluster): number => getClusterElements(b).size - getClusterElements(a).size;
    const sortedClustering = Array.from(this.currentClustering).sort(sortf);
    return sortedClustering.indexOf(this.selectedCluster!);
  }

  goToInfo():void {
    this.$router.replace("#");
    this.$router.replace(`#${this.getClusterIndex()}`);
  }
}
</script>
<style>
.selected-info {
  max-width: 350px;
  position: absolute;
  z-index: 5;
}

.namecontainer {
  max-height: 35vh;
  overflow-y: auto;
}
</style>
