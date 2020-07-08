<template>
  <v-card>
    <v-card-title>
      Summary
      <v-spacer></v-spacer>
      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        label="Search"
        single-line
        hide-details
      ></v-text-field>
    </v-card-title>
    <v-data-table
      :headers="headers"
      :items="items"
      :items-per-page="15"
      :search="search"
      :loading="!dataLoaded"
      class="elevation-1"
    ></v-data-table>
  </v-card>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Intersection } from "@/api/api";

@Component
export default class IntersectionsTable extends Vue {
  @Prop() dataLoaded!: boolean;
  @Prop() intersections!: Intersection[];
  @Prop({ default: "" }) search!: string;

  get headers(): Array<{text: string; value: string; sortable?: boolean}> {
    return [
      { text: "Left file", value: "left", sortable: false },
      { text: "Right file", value: "right", sortable: false },
      { text: "Similarity", value: "similarity" },
      { text: "Continuous overlap", value: "cont" },
      { text: "Total overlap", value: "total" },
    ];
  }

  get items(): Array<{left: string; right: string; similarity: string}> {
    return this.intersections.map(intersection => ({
      left: intersection.leftFile.path,
      right: intersection.rightFile.path,
      similarity: intersection.similarity.toFixed(2),
      cont: intersection.continuousOverlap,
      total: intersection.totalOverlap,
    }));
  }
}
</script>

<style scoped>

</style>
