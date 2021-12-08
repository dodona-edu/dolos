<template>
  <div>
    <h2> Time Chart </h2>
    <div class="d-flex flex-column justify-start align-center">
      <TimeSeriesDiagram :cluster="cluster" :selection="true" @filedata="setNewFiles"/>
      <div class="d-flex flex-row fileInfoContainer" >
        <div v-for="file in files" :key="file.id">

          <v-alert
            border="left"
            color="blue-grey"
            dark
          >
            {{file.extra.timestamp.toLocaleString()}} <br/>
            {{file.extra.fullName}}
          </v-alert>

        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import { Component, Vue, Prop } from "vue-property-decorator";
import TimeSeriesDiagram from "@/components/clustering/TimeSeries.vue";
import { File } from "@/api/api";

@Component({ components: { TimeSeriesDiagram } })
export default class TimeSeriesCard extends Vue {
  @Prop() cluster!: Cluster;
  private files: File[] = [];

  setNewFiles(files: File[]): void {
    this.files = files.sort((a, b) => a.extra.timestamp!.valueOf() - b.extra.timestamp!.valueOf());
  }
}
</script>

<style>
.fileInfoContainer {
  min-height: 100px;
  width: 80%;
}
</style>
