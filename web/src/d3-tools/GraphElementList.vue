<template>
  <v-card elevation="2" outlined class="selected-info">
    <v-card-title>
      Files in this cluster
    </v-card-title>

    <v-card-text>
      <v-simple-table>
        <template v-slot:default>
          <thead>
            <tr>
              <th class="text-left">Name</th>
              <th class="text-left">Timestamp</th>
          </tr>
          </thead>
          <tbody>
          <tr
          v-for="element in getElements()"
          :key="element.id">
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
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import { File } from "@/api/api";
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import { getClusterElementsArray } from "@/util/clustering-algorithms/ClusterFunctions";
import { DateTime } from "luxon";

@Component({})
export default class GraphElementList extends Vue {
  @Prop() cluster!: Cluster;
  @Prop({ default: null }) hoveringFile!: File | null;

  getElements(): Array<File> {
    return getClusterElementsArray(this.cluster)
      .sort((a, b) =>
        a.extra.timestamp && b.extra.timestamp
          ? (DateTime.fromJSDate(a.extra.timestamp) < DateTime.fromJSDate(b.extra.timestamp) ? -1 : 1)
          : 1
      );
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

  formatTime(time: Date): string {
    return DateTime.fromJSDate(time).toLocaleString();
  }
}
</script>
<style scoped lang="scss">
.selected-info {
  max-width: 1000px;
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
