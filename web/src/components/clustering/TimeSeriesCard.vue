<template>
  <div>
    <div class="d-flex flex-row justify-space-around align-center" v-if="show">
      <div class="d-flex gel-items">
        <GraphElementList :cluster="cluster" :selected-files="files" :scroll="true" @select-file="selectFile">

        </GraphElementList>
      </div>
      <TimeSeriesDiagram :cluster="cluster" :selection="true" @filedata="setNewFiles" :selected-files="files"/>

    </div>
    <div v-if="!show">
      <p>Your files do not all include a timestamp. The time series card is unavailable.</p>
    </div>
  </div>
</template>

<script lang="ts">
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import { Component, Vue, Prop } from "vue-property-decorator";
import TimeSeriesDiagram from "@/components/clustering/TimeSeries.vue";
import { File } from "@/api/api";
import GraphElementList from "@/d3-tools/GraphElementList.vue";

@Component({ components: { TimeSeriesDiagram, GraphElementList } })
export default class TimeSeriesCard extends Vue {
  @Prop() cluster!: Cluster;
  private files: File[] = [];
  private show = true;

  setNewFiles(files: File[]): void {
    this.show = files.every(f => f.extra.timestamp);
    if (!this.show) { return; }
    this.files = files.sort((a, b) => a.extra.timestamp!.valueOf() - b.extra.timestamp!.valueOf());
  }

  selectFile(file: File): void {
    if (this.files.includes(file)) {
      this.files = this.files.filter(f => f.id !== file.id);
    } else {
      this.files = [...this.files, file];
    }
  }
}
</script>

<style>
.fileInfoContainer {
  min-height: 100px;
  width: 80%;
}
.user-card {
  margin: 5px;
}

.gel-items {
  max-height: 375px;
}
</style>
