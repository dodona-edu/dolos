<template>
  <v-container fluid>
    <v-row justify="center">
      <v-col cols="10">
        <IntersectionsTable
          :diffs="diffs"
          loaded="dataLoaded"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import IntersectionsTable from "@/components/IntersectionsTable.vue";
import DataView from "@/views/DataView";

@Component({
  components: { IntersectionsTable }
})
export default class Home extends DataView {
  created(): Promise<void> {
    return super.ensureData();
  }
}
</script>
