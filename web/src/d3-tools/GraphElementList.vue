<template>
  <v-card elevation="2" outlined class="graph-element-list">
    <v-card-title>
      Files in this cluster
    </v-card-title>

    <v-card-text>
      <v-simple-table>
        <template v-slot:default>
          <thead>
            <tr>
              <th></th>
              <th class="text-left">Name</th>
              <th class="text-left">Timestamp</th>
          </tr>
          </thead>
          <tbody>
          <tr
          v-for="element in getElements()"
          :key="element.id"
          :id="`element-${element.id}`"
          @click="rowClick(element)"
          v-bind:class="{ selected: selectedFiles.includes(element) }"
          >
            <td>
              <v-tooltip top>
                <template v-slot:activator="{ on, attrs }">
                  <span class="tiny-color" :style="`background-color: ${getColor(element)}`"
                        v-bind="attrs"
                        v-on="on"></span>
                </template>
                <span>{{element.extra.labels || "No label"}}</span>
              </v-tooltip>
            </td>
            <td>{{ element.path.split("/").slice(-2).join("/") }}</td>
            <td>{{ formatTime(element.extra.timestamp) }}</td>
          </tr>
          </tbody>
        </template>
      </v-simple-table>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import { File } from "@/api/api";
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import { getClusterElementsArray } from "@/util/clustering-algorithms/ClusterFunctions";
import { DateTime } from "luxon";
import DataView, { Legend } from "@/views/DataView";
import { booleanSort, chainSort, reverseSort, timestampSort } from "@/util/SortingFunctions";

@Component({})
export default class GraphElementList extends DataView {
  @Prop() cluster!: Cluster;
  private legend: Legend | null = null;
  @Prop({ default: () => [] }) private selectedFiles!: File[];
  @Prop({ default: false }) private sortBySelected!: boolean;
  @Prop({ default: false }) private scroll!: boolean;

  mounted(): void {
    this.legend = this.createLegend();
  }

  getElements(): Array<File> {
    const sortBySelectedFunction = chainSort<File>(
      reverseSort(booleanSort(f => this.selectedFiles.includes(f))),
      timestampSort(f => f.extra.timestamp || new Date())
    );

    const sortByTimestampFunction = timestampSort<File>(f => f.extra.timestamp || new Date());

    return getClusterElementsArray(this.cluster)
      .sort(this.sortBySelected ? sortBySelectedFunction : sortByTimestampFunction);
  }

  formatTime(time: Date): string {
    return DateTime.fromJSDate(time).toLocaleString();
  }

  getColor(file: File): string {
    if (!this.legend || !file.extra.labels || !this.legend[file.extra.labels]) { return ""; }

    return this.legend[file.extra.labels].color;
  }

  rowClick(file: File): void {
    this.$emit("select-file", file);
  }

  @Watch("selectedFiles")
  scrollToSelected(): void {
    if (this.selectedFiles.length > 0 && this.scroll) {
      const element = this.selectedFiles[0];
      this.$vuetify.goTo(`#element-${element.id}`, { container: ".graph-element-list" });
    }
  }
}
</script>
<style scoped lang="scss">
.graph-element-list {
  max-width: 500px;
  max-height: 350px;
  overflow: auto;
  z-index: 5;
}

.active {
  background-color: darkgray;
}

.element {
  text-align: center;
  border-radius: 10px;
  margin: 5px;
  padding: 5px;
}

.tiny-color {
  background-color: grey;
  width: 10px;
  height: 10px;
  display: block;
  border-radius: 50%;
}

.selected {
  background-color: #f0f0f0;
}
</style>
