<template>
  <v-container fluid>
    <v-row justify="center">
      <v-col cols="10">
        <CompareCard
          :loaded="dataLoaded"
          :intersection="intersection"/>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import DataView from "@/views/DataView";
import { Component, Prop } from "vue-property-decorator";
import CompareCard from "@/components/CompareCard.vue";
import { Intersection } from "@/api/api";

@Component({
  components: { CompareCard }
})
export default class Compare extends DataView {
  @Prop({ required: true }) intersectionId!: number;

  created(): void {
    super.ensureData();
  }

  get intersection(): Intersection | undefined {
    return this.intersections[+this.intersectionId];
  }
}
</script>

<style scoped>

</style>
