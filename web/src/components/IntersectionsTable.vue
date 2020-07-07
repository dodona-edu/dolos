<template>
  <v-data-table
    :headers="headers"
    :items="items"
    :items-per-page="50"
    class="elevation-1">
  </v-data-table>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Intersection } from "@/api/api";

@Component
export default class IntersectionsTable extends Vue {
  @Prop() intersections!: Intersection[];

  get headers(): Array<{text: string; value: string; sortable?: boolean}> {
    return [
      { text: "Left file", value: "left", sortable: false },
      { text: "Right file", value: "right", sortable: false },
      { text: "Similarity", value: "similarity" },
    ];
  }

  get items(): Array<{left: string; right: string; similarity: string}> {
    return this.intersections.map(intersection => ({
      left: intersection.leftFile.path,
      right: intersection.rightFile.path,
      similarity: intersection.similarity.toFixed(2)
    }));
  }
}
</script>

<style scoped>

</style>
