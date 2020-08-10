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
      :must-sort="true"
      :sort-by="'similarity'"
      :sort-desc="true"
      :items-per-page="15"
      :search="search"
      :loading="!loaded || !itemsLoaded"
      class="elevation-1"
      @click:row="rowClicked"
    >
    </v-data-table>
  </v-card>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Diff } from "@/api/api";

@Component
export default class DiffTable extends Vue {
  @Prop() loaded!: boolean;
  @Prop() diffs!: Diff[];
  @Prop({ default: "" }) search!: string;
  itemsLoaded = false;

  headers = [
    { text: "Left file", value: "left", sortable: false },
    { text: "Right file", value: "right", sortable: false },
    { text: "Similarity", value: "similarity" },
    { text: "Continuous overlap", value: "cont" },
    { text: "Total overlap", value: "total" },
  ];

  get items(): Array<{left: string; right: string; similarity: string}> {
    const items = Object.values(this.diffs).map(intersection => ({
      intersection,
      left: intersection.leftFile.path,
      right: intersection.rightFile.path,
      similarity: intersection.similarity.toFixed(2),
      cont: intersection.continuousOverlap,
      total: intersection.totalOverlap,
    }));
    this.itemsLoaded = items.length !== 0;
    return items;
  }

  public rowClicked(item: {intersection: Diff}): void {
    this.$router.push(`/compare/${item.intersection.id}`);
  }
}
</script>

<style scoped>
  .v-data-table >>> tr:hover {
    cursor: pointer;
  }
</style>
