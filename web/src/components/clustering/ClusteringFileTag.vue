<template>
  <div class="circle" :style="`background-color: ${getColor()}; border-color: ${getColor()}`">
    <span>{{getInitials()}}</span>
  </div>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import { File } from "@/api/api";
import DataView, { Legend } from "@/views/DataView";

@Component({})
export default class ClusteringFileTag extends DataView {
  @Prop({ required: true }) file!: File;

  private legend: Legend | null = null;
  constructor() {
    super();
    this.initialize();
  }

  async initialize(): Promise<void> {
    await this.ensureData();
    this.legend = this.createLegend();
  }

  getInitials(): string {
    if (this.file.extra.fullName) {
      const splitName = this.file.extra.fullName.split(" ");
      if (splitName.length === 2) {
        return (splitName[0][0] + splitName[1][0]).toUpperCase();
      } else {
        return this.file.extra.fullName[0].toUpperCase();
      }
    } else {
      const path = this.file.path.split("/");
      return path[path.length - 1][0].toUpperCase();
    }
  }

  getColor(): string {
    if (!this.legend || !this.file.extra.labels) { return "blue"; }
    return this.legend[this.file.extra.labels].color;
  }
}
</script>
<style>
.circle {
  border-radius: 50%;
  background-color: lightblue;
  text-align: center;
  width: 40px;
  height: 40px;
  line-height: 40px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin: 0 3px;
}

</style>
