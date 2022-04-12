<template>
  <v-card elevation="2" outlined class="selected-info">
    <v-card-title>
      Files in this cluster
    </v-card-title>

    <v-card-text>
      <div v-for="el of getElements()" :key="el.id" :id="`graph-element-list-${el.id}`"
           v-bind:class="{ active: hoveringFile && el.id === hoveringFile.id }" class="element">
        {{el.path.split("/").slice(-2).join("/")}}
      </div>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import { File } from "@/api/api";
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import { getClusterElements } from "@/util/clustering-algorithms/ClusterFunctions";

export type Legend = {[key: string]: { label: string; selected: boolean; color: string }};

@Component({})
export default class GraphElementList extends Vue {
  @Prop() cluster!: Cluster;
  @Prop({ default: null }) hoveringFile!: File | null;

  getElements(): Set<File> {
    return getClusterElements(this.cluster);
  }

  @Watch("hoveringFile")
  hoveringFileChange(): void {
    if (this.hoveringFile) {
      const el = document.getElementById(`graph-element-list-${this.hoveringFile.id}`);
      if (el) {
        el.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    }
  }
}
</script>
<style scoped lang="scss">
.selected-info {
  max-width: 350px;
  max-height: 350px;
  overflow: auto;
  position: absolute;
  z-index: 5;
  top: 20px;
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
</style>
