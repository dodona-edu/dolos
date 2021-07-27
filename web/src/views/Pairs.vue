<template>
  <v-container fluid>
    <v-row justify="center">
      <v-col cols="10">
        <PairsTable
          :pairs="pairs"
          :loaded="dataLoaded"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import PairsTable from "@/components/PairsTable.vue";
import DataView from "@/views/DataView";

@Component({
  components: { PairsTable }
})
export default class Pairs extends DataView {
  created(): Promise<void> {
    return super.ensureData();
  }
}
</script>
